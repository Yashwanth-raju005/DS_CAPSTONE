import java.io.Serializable;

// Serializable class to hold warden contact information
public class WardenContact implements Serializable {
    private String name;
    private String phone;
    private String email;
    
    public WardenContact(String name, String phone, String email) {
        this.name = name;
        this.phone = phone;
        this.email = email;
    }
    
    public String getName() {
        return name;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public String getEmail() {
        return email;
    }
}

