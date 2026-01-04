import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.rmi.Naming;

// RMI Server
public class RoomInfoServer {
    public static void main(String[] args) {
        try {
            // Create and export the remote object
            RoomInfoService service = new RoomInfoService();
            
            // Create RMI registry on port 1099
            Registry registry = LocateRegistry.createRegistry(1099);
            
            // Bind the remote object
            registry.rebind("RoomInfoService", service);
            
            System.out.println("RMI Server started on port 1099");
            System.out.println("RoomInfoService is ready!");
        } catch (Exception e) {
            System.err.println("Server exception: " + e.toString());
            e.printStackTrace();
        }
    }
}

