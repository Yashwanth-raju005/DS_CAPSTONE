import java.rmi.Remote;
import java.rmi.RemoteException;

// Remote interface for Room Information Service
public interface RoomInfoInterface extends Remote {
    // Method 1: Get room information by room number
    RoomInfo getRoomInfo(String roomNumber) throws RemoteException;
    
    // Method 2: Get warden contact for a room
    WardenContact getWardenContact(String roomNumber) throws RemoteException;
}

