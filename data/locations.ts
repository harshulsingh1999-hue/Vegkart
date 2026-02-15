
// Mock Database of Indian Locations
// Structure: State -> City -> Pincodes

export interface LocationHierarchy {
    [state: string]: {
        [city: string]: string[]; // Array of Pincodes
    }
}

export const locationDB: LocationHierarchy = {
    "Maharashtra": {
        "Mumbai": ["400001", "400002", "400005", "400050", "400076"],
        "Pune": ["411001", "411004", "411038", "411057"],
        "Nagpur": ["440001", "440010", "440022"]
    },
    "Delhi": {
        "New Delhi": ["110001", "110002", "110020", "110045"],
        "North Delhi": ["110007", "110009"]
    },
    "Karnataka": {
        "Bengaluru": ["560001", "560002", "560034", "560100"],
        "Mysuru": ["570001", "570008"]
    },
    "Gujarat": {
        "Ahmedabad": ["380001", "380009", "380015"],
        "Surat": ["395001", "395003", "395007"]
    },
    "Tamil Nadu": {
        "Chennai": ["600001", "600004", "600018", "600040"],
        "Coimbatore": ["641001", "641004"]
    }
};
