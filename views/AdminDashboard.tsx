
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { User, Role, Order } from '../types';
import { 
    ShieldCheckIcon, ArrowPathIcon, BugAntIcon, TrashIcon,
    WrenchScrewdriverIcon, LockClosedIcon, CommandLineIcon,
    UserCircleIcon, PlusIcon, ShopIcon, TruckIcon, BriefcaseIcon, XMarkIcon,
    PencilIcon, CurrencyRupeeIcon, ClipboardListIcon, InformationCircleIcon,
    BadgeCheckIcon, PhoneIcon, ChartBarIcon, ServerIcon, DocumentTextIcon,
    EyeIcon, MapIcon
} from '../components/ui/Icons';
import { useToast } from '../providers/ToastProvider';
import { formatCurrency, getDateOnly } from '../utils';
import ExportMenu from '../components/ExportMenu';
import ImportButton from '../components/ImportButton';

// --- MAP COMPONENTS ---
const MAP_STYLES = {
    land: '#eef0f3',
    park: '#c5e8c5',
    building: '#e1e3e6',
    buildingStroke: '#d6d6d6',
    roadFill: '#ffffff',
    textRoad: '#757575'
};

const CityBlock = ({ x, y, width, height, type }: any) => {
    const fill = type === 'park' ? MAP_STYLES.park : MAP_STYLES.building;
    const stroke = type === 'park' ? 'none' : MAP_STYLES.buildingStroke;
    return <rect x={x} y={y} width={width} height={height} rx="2" fill={fill} stroke={stroke} strokeWidth="0.5" />;
};

const generateCityLayout = (pincode: string) => {
    let seed = 0;
    for (let i = 0; i < pincode.length; i++) seed += pincode.charCodeAt(i);
    const rng = () => { const x = Math.sin(seed++) * 10000; return x - Math.floor(x); };
    const blocks = [];
    const roads = [];
    const cols = 6, rows = 4, gap = 6;
    const cw = (100 - (cols+1)*gap)/cols;
    const ch = (100 - (rows+1)*gap)/rows;
    for(let c=0; c<cols; c++) {
        for(let r=0; r<rows; r++) {
            blocks.push({ id: `b-${c}-${r}`, x: gap + c*(cw+gap), y: gap + r*(ch+gap), w: cw, h: ch, type: rng() > 0.8 ? 'park' : 'bld' });
        }
    }
    
    // Roads with simple names
    for(let r=0; r<=rows; r++) {
        roads.push({ x1: 50, y1: 0, x2: 50, y2: 100, width: 3, name: "Main St", isVertical: true }); // simplified structure for admin preview
        roads.push({ x1: 0, y1: r*(ch+gap) + gap/2, x2: 100, y2: r*(ch+gap) + gap/2, width: gap, name: `St ${r+1}` });
    }
    for(let c=0; c<=cols; c++) {
        roads.push({ x1: c*(cw+gap) + gap/2, y1: 0, x2: c*(cw+gap) + gap/2, y2: 100, width: gap, name: `Ave ${c+1}`, isVertical: true });
    }
    return { blocks, roads };
};

const AdminMapPanel = ({ orders, users }: { orders: Order[], users: User[] }) => {
    // Group active orders by pincode
    const activeOrders = orders.filter(o => ['Placed', 'Preparing', 'Out for Delivery'].includes(o.status));
    const pincodes = Array.from(new Set(activeOrders.map(o => o.deliveryAddress.pincode)));
    const [selectedPincode, setSelectedPincode] = useState<string>(pincodes[0] || '');

    const { blocks, roads } = useMemo(() => generateCityLayout(selectedPincode || '000000'), [selectedPincode]);
    const mapOrders = activeOrders.filter(o => o.deliveryAddress.pincode === selectedPincode);

    // Normalize helper
    const normalize = (val: number, min: number, max: number) => (max === min) ? 50 : ((val - min) / (max - min)) * 80 + 10;

    // Calc bounds
    const coords = mapOrders.map(o => o.deliveryAddress.coordinates || { lat: 0, lng: 0 });
    const minLat = Math.min(...coords.map(c => c.lat)); const maxLat = Math.max(...coords.map(c => c.lat));
    const minLng = Math.min(...coords.map(c => c.lng)); const maxLng = Math.max(...coords.map(c => c.lng));

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-blue-600" /> Live Delivery Monitor
                </h3>
                <div className="flex gap-2 overflow-x-auto max-w-md scrollbar-hide">
                    {pincodes.length === 0 && <span className="text-sm text-gray-400 italic">No active regions</span>}
                    {pincodes.map(p => (
                        <button 
                            key={p} 
                            onClick={() => setSelectedPincode(p)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${selectedPincode === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative h-96 bg-[#eef0f3] rounded-xl overflow-hidden border border-gray-200">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Background */}
                    <rect x="0" y="0" width="100" height="100" fill={MAP_STYLES.land} />

                    {blocks.map((b, i) => <CityBlock key={i} {...b} />)}
                    {roads.map((r, i) => (
                        <g key={`r-${i}`}>
                            <line x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="white" strokeWidth={r.width} strokeLinecap="square" />
                            {/* Simple Road labels for Admin view */}
                            {i % 3 === 0 && (
                                <text 
                                    x={(r.x1 + r.x2)/2} 
                                    y={(r.y1 + r.y2)/2} 
                                    fontSize="2" 
                                    fill={MAP_STYLES.textRoad} 
                                    textAnchor="middle" 
                                    dominantBaseline="middle"
                                    transform={r.isVertical ? `rotate(90, ${(r.x1 + r.x2)/2}, ${(r.y1 + r.y2)/2})` : ''}
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {r.name}
                                </text>
                            )}
                        </g>
                    ))}
                    
                    {/* Orders */}
                    {mapOrders.map((o, i) => {
                        const c = o.deliveryAddress.coordinates || { lat: 0, lng: 0 };
                        const cx = normalize(c.lng, minLng, maxLng);
                        const cy = 100 - normalize(c.lat, minLat, maxLat);
                        const statusColor = o.status === 'Out for Delivery' ? '#16a34a' : '#f59e0b';
                        
                        return (
                            <g key={o.id}>
                                <circle cx={cx} cy={cy} r="3" fill={statusColor} stroke="white" strokeWidth="1" className="animate-pulse" />
                                <text x={cx} y={cy - 5} fontSize="3" textAnchor="middle" fill="#374151" fontWeight="bold">#{o.id.split('-')[1]}</text>
                            </g>
                        );
                    })}
                </svg>
                
                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-2 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-1 mb-1"><span className="w-2 h-2 rounded-full bg-green-600"></span> Out for Delivery</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Preparing</div>
                </div>
            </div>
        </div>
    );
};

// ... SHARED COMPONENTS (StatCard, GlobalSalesChart, SystemHealthWidget, AdminOrdersPanel, UserManagementPanel, SecurityPanel) same as before ...
// Only AdminDashboard component export changes were needed to update the map. 
// Re-exporting the full file content for clarity/consistency is best practice here to avoid missing parts.

const StatCard = ({ title, value, icon: Icon, colorClass, sub }: any) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-all group">
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-black text-gray-800 mt-1">{value}</h3>
            {sub && <p className="text-[10px] text-gray-400 mt-1 font-medium">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl text-white shadow-sm ${colorClass} group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const GlobalSalesChart = ({ orders }: { orders: Order[] }) => {
    const data = useMemo(() => {
        const days = [];
        const today = new Date();
        let maxVal = 0;
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
            
            const dailyTotal = orders
                .filter(o => o.status !== 'Cancelled' && new Date(o.date).toDateString() === d.toDateString())
                .reduce((acc, o) => acc + (o.total || 0), 0);
            
            if (dailyTotal > maxVal) maxVal = dailyTotal;
            days.push({ day: dateStr, value: dailyTotal });
        }
        return { days, maxVal: maxVal || 1 };
    }, [orders]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-blue-600" /> Global Revenue Trend
            </h3>
            <div className="flex items-end justify-between h-40 gap-3">
                {data.days.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <div 
                            className="w-full bg-blue-100 rounded-t-lg relative group-hover:bg-blue-500 transition-all duration-300"
                            style={{ height: `${(item.value / data.maxVal) * 100}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {formatCurrency(item.value)}
                            </div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{item.day}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SystemHealthWidget = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ServerIcon className="w-5 h-5 text-purple-600" /> Platform Health
        </h3>
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-bold text-green-800">API Server</span>
                </div>
                <span className="text-xs font-bold text-green-600">99.9% Uptime</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-bold text-blue-800">Database</span>
                </div>
                <span className="text-xs font-bold text-blue-600">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-sm font-bold text-purple-800">Payment Gateway</span>
                </div>
                <span className="text-xs font-bold text-purple-600">Operational</span>
            </div>
        </div>
    </div>
);

const AdminOrdersPanel = () => {
    const orders = useStore(state => state.orders);
    const users = useStore(state => state.users);
    const { showToast } = useToast();
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesFilter = filter === 'All' ? true :
                filter === 'Active' ? ['Placed', 'Preparing', 'Ready for Pickup', 'Out for Delivery'].includes(o.status) :
                filter === 'Delivered' ? o.status === 'Delivered' :
                filter === 'Cancelled' ? o.status === 'Cancelled' : true;
            
            const customer = users.find(u => u.id === o.userId);
            const searchLower = search.toLowerCase();
            const matchesSearch = 
                o.id.toLowerCase().includes(searchLower) ||
                (customer?.name || '').toLowerCase().includes(searchLower) ||
                (customer?.phone || '').includes(searchLower);

            return matchesFilter && matchesSearch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, users, filter, search]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="relative flex-grow">
                    <input 
                        type="text" 
                        placeholder="Search Orders..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <div className="absolute left-3 top-3 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
                <div className="flex gap-2">
                    <select 
                        value={filter} 
                        onChange={e => setFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    
                    <ExportMenu data={filteredOrders} filename="admin_orders_export" title="Global Orders Report" />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Order Details</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Customer</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map(order => {
                                const customer = users.find(u => u.id === order.userId);
                                return (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <span className="font-bold text-gray-800 text-sm">#{order.id.split('-')[1]}</span>
                                            <p className="text-xs text-gray-500 mt-1">{getDateOnly(order.date)}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-gray-800">{customer?.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{customer?.phone}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                                            <p className="text-xs text-gray-400">{order.paymentMethod}</p>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredOrders.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No orders found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const UserManagementPanel = () => {
    const { users, deleteUser, adminUpdateUser, adminAddUser, startPreview } = useStore();
    const { showToast } = useToast();
    
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<Partial<User>>({});
    const [isEditMode, setIsEditMode] = useState(false);

    const filteredUsers = users.filter(u => {
        const matchesRole = roleFilter === 'All' || u.roles?.includes(roleFilter) || u.role === roleFilter;
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                              u.phone.includes(search) || 
                              u.id.includes(search);
        return matchesRole && matchesSearch;
    });

    const handleImpersonate = (user: User) => {
        if (confirm(`Login as ${user.name}?`)) {
            startPreview(user);
            showToast(`Logged in as ${user.name}`, 'success');
        }
    };

    const handleDelete = (userId: string) => {
        if (confirm('Delete User?')) {
            deleteUser(userId);
            showToast('User deleted', 'info');
        }
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser.phone || !editUser.name || !editUser.role) {
            showToast('Required fields missing', 'error');
            return;
        }

        if (isEditMode && editUser.id) {
            adminUpdateUser(editUser.id, editUser);
            showToast('User Updated', 'success');
        } else {
            const newUser: User = {
                id: `user-${Date.now()}`,
                name: editUser.name,
                phone: editUser.phone,
                role: editUser.role,
                roles: [editUser.role],
                isProfileComplete: true,
                addresses: [],
                ...editUser
            };
            adminAddUser(newUser);
            showToast('User Created', 'success');
        }
        setIsModalOpen(false);
    };

    const handleImportUsers = (importedData: any[]) => {
        let count = 0;
        importedData.forEach((row: any) => {
            const phone = (row.Phone || row.phone || '').toString();
            const name = row.Name || row.name || '';
            const role = (row.Role || row.role || 'customer').toLowerCase();

            if (phone && name) {
                const newUser: User = {
                    id: `user-imp-${Date.now()}-${count}`,
                    phone: phone,
                    name: name,
                    role: role as Role,
                    roles: [role as Role],
                    isProfileComplete: true,
                    addresses: [],
                    businessName: row.BusinessName || row.businessName,
                    gstin: row.GSTIN || row.gstin,
                    vehicleDetails: row.Vehicle || row.vehicleDetails,
                    employeeId: row.EmployeeID || row.employeeId
                };
                adminAddUser(newUser);
                count++;
            }
        });
        showToast(`Imported ${count} users successfully`, 'success');
    };

    const openAddModal = () => {
        setEditUser({ role: 'customer' });
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditUser({ ...user });
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="relative w-full md:w-96">
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <UserCircleIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select 
                        value={roleFilter} 
                        onChange={e => setRoleFilter(e.target.value as any)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                        <option value="All">All Roles</option>
                        <option value="customer">Customer</option>
                        <option value="seller">Seller</option>
                        <option value="delivery">Delivery</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                    </select>
                    
                    <ImportButton onImport={handleImportUsers} label="Import" />
                    <ExportMenu data={filteredUsers} filename="users_db_export" title="Registered Users" />

                    <button 
                        onClick={openAddModal}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 flex items-center gap-2 shadow-md active:scale-95 transition-all"
                    >
                        <PlusIcon className="w-4 h-4" /> Add User
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">User</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Details</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs border">
                                                {user.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                                                <p className="text-xs text-gray-500 font-mono">{user.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                            user.role === 'seller' ? 'bg-blue-100 text-blue-700' :
                                            user.role === 'delivery' ? 'bg-orange-100 text-orange-700' :
                                            user.role === 'staff' ? 'bg-purple-100 text-purple-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {user.role === 'seller' && <p className="text-xs text-gray-600"><span className="font-bold">Biz:</span> {user.businessName}</p>}
                                        {user.role === 'delivery' && <p className="text-xs text-gray-600"><span className="font-bold">Veh:</span> {user.vehicleDetails}</p>}
                                        <p className="text-[10px] text-gray-400 mt-0.5">ID: {user.id}</p>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleImpersonate(user)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Login as this user"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => openEditModal(user)}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Edit User"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete User"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD/EDIT USER MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">{isEditMode ? 'Edit User' : 'Add New User'}</h3>
                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    value={editUser.name || ''} 
                                    onChange={e => setEditUser({...editUser, name: e.target.value})} 
                                    className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                                <input 
                                    type="text" 
                                    value={editUser.phone || ''} 
                                    onChange={e => setEditUser({...editUser, phone: e.target.value})} 
                                    className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                                <select 
                                    value={editUser.role} 
                                    onChange={e => setEditUser({...editUser, role: e.target.value as Role})} 
                                    className="w-full border rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="customer">Customer</option>
                                    <option value="seller">Seller</option>
                                    <option value="delivery">Delivery</option>
                                    <option value="staff">Staff</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            
                            {editUser.role === 'seller' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Name</label>
                                    <input type="text" value={editUser.businessName || ''} onChange={e => setEditUser({...editUser, businessName: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-xl hover:bg-purple-700 shadow-md transition-colors">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const SecurityPanel = () => {
    const { 
        securityThreats, performSecurityScan, resolveAllThreats, 
        lastSecurityScan, setAppPin, isSystemCodeLocked 
    } = useStore();
    const { showToast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [newPin, setNewPin] = useState('');

    const handleScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            performSecurityScan();
            setIsScanning(false);
            showToast('System Scan Completed', 'success');
        }, 1500);
    };

    const handleResolve = () => {
        resolveAllThreats();
        showToast('All threats neutralized.', 'success');
    };

    const handleUpdatePin = () => {
        if(newPin.length < 4) return showToast('PIN too short', 'error');
        setAppPin(newPin);
        setNewPin('');
        showToast('App PIN Updated', 'success');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">System Integrity</h3>
                            <p className="text-xs text-gray-500">Last Scan: {lastSecurityScan ? new Date(lastSecurityScan).toLocaleTimeString() : 'Never'}</p>
                        </div>
                        {securityThreats.length === 0 ? (
                            <div className="bg-green-100 text-green-700 p-2 rounded-full"><ShieldCheckIcon className="w-8 h-8" /></div>
                        ) : (
                            <div className="bg-red-100 text-red-700 p-2 rounded-full animate-pulse"><BugAntIcon className="w-8 h-8" /></div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleScan}
                            disabled={isScanning}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            <ArrowPathIcon className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
                            {isScanning ? 'Scanning...' : 'Run Scan'}
                        </button>
                        {securityThreats.length > 0 && (
                            <button 
                                onClick={handleResolve}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <WrenchScrewdriverIcon className="w-5 h-5" />
                                Fix All
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <LockClosedIcon className="w-5 h-5 text-gray-500" /> App Security PIN
                    </h3>
                    <div className="flex gap-2">
                        <input 
                            type="password" 
                            value={newPin} 
                            onChange={e => setNewPin(e.target.value)} 
                            className="flex-grow border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                            placeholder="Enter New PIN"
                        />
                        <button 
                            onClick={handleUpdatePin}
                            className="bg-gray-900 text-white font-bold px-6 rounded-xl hover:bg-black transition-colors shadow-lg"
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    const { logout, users, orders, products } = useStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'orders' | 'users' | 'security'>('overview');

    const stats = {
        users: users.length,
        orders: orders.length,
        products: products.length,
        revenue: orders.filter(o => o.status !== 'Cancelled').reduce((acc, o) => acc + (o.total || 0), 0)
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="bg-gray-900 p-2 rounded-xl shadow-lg">
                        <CommandLineIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-800 tracking-tight">ADMIN CONSOLE</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">System Control & Analytics</p>
                    </div>
                </div>
                <button onClick={logout} className="text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 px-5 py-2.5 rounded-xl transition-all border border-red-100 hover:border-red-600 shadow-sm">
                    Sign Out
                </button>
            </header>

            <div className="px-6 py-4 flex gap-2 overflow-x-auto scrollbar-hide bg-white/50 backdrop-blur-sm sticky top-[73px] z-20">
                {[
                    { id: 'overview', label: 'Overview', icon: BriefcaseIcon },
                    { id: 'map', label: 'Live Map', icon: MapIcon },
                    { id: 'orders', label: 'Global Orders', icon: ClipboardListIcon },
                    { id: 'users', label: 'User Management', icon: UserCircleIcon },
                    { id: 'security', label: 'Security Center', icon: ShieldCheckIcon },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm transform active:scale-95 whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-gray-900 text-white shadow-gray-400' 
                            : 'bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <main className="flex-grow p-6 max-w-7xl mx-auto w-full animate-fade-in">
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <StatCard title="Total Users" value={stats.users} icon={UserCircleIcon} colorClass="bg-blue-600" />
                            <StatCard title="Total Orders" value={stats.orders} icon={ClipboardListIcon} colorClass="bg-orange-500" />
                            <StatCard title="Products" value={stats.products} icon={ShopIcon} colorClass="bg-purple-600" />
                            <StatCard title="Net Revenue" value={formatCurrency(stats.revenue)} icon={CurrencyRupeeIcon} colorClass="bg-green-600" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <GlobalSalesChart orders={orders} />
                            </div>
                            <div className="lg:col-span-1">
                                <SystemHealthWidget />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'map' && <AdminMapPanel orders={orders} users={users} />}
                {activeTab === 'orders' && <AdminOrdersPanel />}
                {activeTab === 'users' && <UserManagementPanel />}
                {activeTab === 'security' && <SecurityPanel />}
            </main>
        </div>
    );
};

export default AdminDashboard;
