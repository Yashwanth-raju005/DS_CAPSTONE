import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;

// Example RMI Client
public class RoomInfoClient {
    public static void main(String[] args) {
        try {
            // Get the registry
            Registry registry = LocateRegistry.getRegistry("localhost", 1099);
            
            // Look up the remote object
            RoomInfoInterface service = (RoomInfoInterface) registry.lookup("RoomInfoService");
            
            // Test Method 1: Get room information
            RoomInfo room = service.getRoomInfo("A101");
            if (room != null) {
                System.out.println("Room: " + room.getRoomNumber());
                System.out.println("Occupants: " + String.join(", ", room.getOccupantNames()));
                System.out.println("Warden: " + room.getWardenContact().getName());
            }
            
            // Test Method 2: Get warden contact
            WardenContact warden = service.getWardenContact("A101");
            if (warden != null) {
                System.out.println("Warden Name: " + warden.getName());
                System.out.println("Phone: " + warden.getPhone());
                System.out.println("Email: " + warden.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Client exception: " + e.toString());
            e.printStackTrace();
        }
    }
}

