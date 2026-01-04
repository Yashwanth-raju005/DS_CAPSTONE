# Java RMI Service for Room Information

This is an optional Java RMI service implementation for Module 2.

## Prerequisites
- Java JDK 8 or higher
- javac and java commands available

## Compilation

```bash
cd rmi-service
javac *.java
```

## Running the RMI Service

1. Start the RMI Registry (in a separate terminal):
```bash
rmiregistry
```

2. Start the RMI Server:
```bash
java RoomInfoServer
```

The server will start on port 1099 (default RMI port).

## Integration with Node.js

The Node.js backend currently uses REST endpoints that simulate RMI behavior. To use the actual Java RMI service, you would need to:

1. Create a Java client that connects to the RMI service
2. Expose it as a REST API or use JNI to call from Node.js

For simplicity in this project, the REST API endpoints serve as RMI simulation.

