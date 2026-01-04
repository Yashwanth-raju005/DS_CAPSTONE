import java.io.Serializable;

// Serializable class to hold room information
public class RoomInfo implements Serializable {
    private String roomNumber;
    private String[] occupantNames;
    private WardenContact wardenContact;
    
    public RoomInfo(String roomNumber, String[] occupantNames, WardenContact wardenContact) {
        this.roomNumber = roomNumber;
        this.occupantNames = occupantNames;
        this.wardenContact = wardenContact;
    }
    
    public String getRoomNumber() {
        return roomNumber;
    }
    
    public String[] getOccupantNames() {
        return occupantNames;
    }
    
    public WardenContact getWardenContact() {
        return wardenContact;
    }
}

