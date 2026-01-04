import java.rmi.RemoteException;
import java.rmi.server.UnicastRemoteObject;
import java.util.HashMap;
import java.util.Map;

// Implementation of Room Information Service
public class RoomInfoService extends UnicastRemoteObject implements RoomInfoInterface {
    private Map<String, RoomInfo> roomDatabase;
    
    public RoomInfoService() throws RemoteException {
        super();
        initializeDatabase();
    }
    
    private void initializeDatabase() {
        roomDatabase = new HashMap<>();
        
        // Room A101
        roomDatabase.put("A101", new RoomInfo(
            "A101",
            new String[]{"John Doe", "Jane Smith"},
            new WardenContact("Dr. Sarah Johnson", "+91-9876543210", "sarah.j@hostel.edu")
        ));
        
        // Room A102
        roomDatabase.put("A102", new RoomInfo(
            "A102",
            new String[]{"Mike Wilson", "Tom Brown"},
            new WardenContact("Dr. Sarah Johnson", "+91-9876543210", "sarah.j@hostel.edu")
        ));
        
        // Room B201
        roomDatabase.put("B201", new RoomInfo(
            "B201",
            new String[]{"Alice Green"},
            new WardenContact("Prof. Robert Lee", "+91-9876543211", "robert.l@hostel.edu")
        ));
        
        // Room B202
        roomDatabase.put("B202", new RoomInfo(
            "B202",
            new String[]{"Bob White", "Charlie Black", "David Gray"},
            new WardenContact("Prof. Robert Lee", "+91-9876543211", "robert.l@hostel.edu")
        ));
        
        // Room C301
        roomDatabase.put("C301", new RoomInfo(
            "C301",
            new String[]{},
            new WardenContact("Dr. Emily Davis", "+91-9876543212", "emily.d@hostel.edu")
        ));
    }
    
    // Method 1: Get room information
    @Override
    public RoomInfo getRoomInfo(String roomNumber) throws RemoteException {
        return roomDatabase.get(roomNumber.toUpperCase());
    }
    
    // Method 2: Get warden contact
    @Override
    public WardenContact getWardenContact(String roomNumber) throws RemoteException {
        RoomInfo roomInfo = roomDatabase.get(roomNumber.toUpperCase());
        if (roomInfo != null) {
            return roomInfo.getWardenContact();
        }
        return null;
    }
}

