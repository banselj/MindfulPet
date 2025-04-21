import { ViroARScene, ViroARSceneNavigator } from '@viro-community/react-viro';
import { BleManager } from 'react-native-ble-plx';
import Geolocation from 'react-native-geolocation-service';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ARIoTSystem {
  constructor() {
    this.bleManager = new BleManager();
    this.connectedDevices = new Map();
    this.playZones = new Map();
    this.currentLocation = null;
    this.arSession = null;
    this.smartHomeState = new Map();
    
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize BLE
      this.setupBleListeners();
      
      // Initialize Geolocation
      this.setupLocationTracking();
      
      // Load cached play zones
      const cachedZones = await AsyncStorage.getItem('play_zones');
      if (cachedZones) {
        this.playZones = new Map(JSON.parse(cachedZones));
      }

      // Load smart home cache
      const smartHomeCache = await AsyncStorage.getItem('smart_home_state');
      if (smartHomeCache) {
        this.smartHomeState = new Map(JSON.parse(smartHomeCache));
      }
    } catch (error) {
      console.error('Error initializing ARIoTSystem:', error);
    }
  }

  setupBleListeners() {
    // Listen for new BLE devices
    this.bleManager.onStateChange(state => {
      if (state === 'PoweredOn') {
        this.scanForDevices();
      }
    }, true);
  }

  setupLocationTracking() {
    // Start location tracking
    Geolocation.watchPosition(
      position => {
        this.currentLocation = position;
        this.checkPlayZones();
      },
      error => console.error('Location error:', error),
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000
      }
    );
  }

  // AR Features
  initializeARSession(arView) {
    this.arSession = arView;
    return {
      tracking: true,
      worldAlignment: 'gravity',
      planeDetection: true
    };
  }

  async placePetInAR(pet, position) {
    if (!this.arSession) return null;

    const arPet = {
      type: 'pet',
      position,
      scale: [1, 1, 1],
      model: await this.loadPetModel(pet.type),
      animations: await this.loadPetAnimations(pet.type),
      physics: {
        type: 'dynamic',
        mass: 1.0,
        useGravity: true
      }
    };

    return this.arSession.addEntity(arPet);
  }

  async loadPetModel(petType) {
    const models = {
      canine: require('../assets/models/pets/canine.vrx'),
      feline: require('../assets/models/pets/feline.vrx'),
      mystical: require('../assets/models/pets/mystical.vrx')
    };

    return models[petType];
  }

  async loadPetAnimations(petType) {
    const animations = {
      canine: {
        idle: require('../assets/animations/canine/idle.vrx'),
        walk: require('../assets/animations/canine/walk.vrx'),
        play: require('../assets/animations/canine/play.vrx')
      },
      // Add other pet types
    };

    return animations[petType];
  }

  // Play Zones
  async createPlayZone(location, config) {
    const zoneId = `zone_${Date.now()}`;
    const zone = {
      id: zoneId,
      location,
      radius: config.radius || 50, // meters
      type: config.type || 'standard',
      rewards: config.rewards || {},
      createdAt: new Date().toISOString(),
      active: true
    };

    this.playZones.set(zoneId, zone);
    await this.savePlayZones();
    return zone;
  }

  checkPlayZones() {
    if (!this.currentLocation) return;

    this.playZones.forEach(zone => {
      const distance = this.calculateDistance(
        this.currentLocation.coords,
        zone.location
      );

      if (distance <= zone.radius) {
        DeviceEventEmitter.emit('enterPlayZone', zone);
      }
    });
  }

  calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // IoT Integration
  async scanForDevices() {
    try {
      await this.bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('BLE Scan error:', error);
          return;
        }

        if (this.isCompatibleDevice(device)) {
          this.connectToDevice(device);
        }
      });
    } catch (error) {
      console.error('Error starting BLE scan:', error);
    }
  }

  isCompatibleDevice(device) {
    const compatiblePrefixes = ['SmartLight_', 'SmartSpeaker_', 'SmartThermo_'];
    return compatiblePrefixes.some(prefix => device.name?.startsWith(prefix));
  }

  async connectToDevice(device) {
    try {
      const connectedDevice = await device.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      this.connectedDevices.set(device.id, {
        device: connectedDevice,
        type: this.getDeviceType(device.name),
        status: 'connected'
      });

      this.setupDeviceListeners(connectedDevice);
    } catch (error) {
      console.error('Error connecting to device:', error);
    }
  }

  getDeviceType(name) {
    if (name.startsWith('SmartLight_')) return 'light';
    if (name.startsWith('SmartSpeaker_')) return 'speaker';
    if (name.startsWith('SmartThermo_')) return 'thermostat';
    return 'unknown';
  }

  setupDeviceListeners(device) {
    device.monitorCharacteristicForService(
      'device_status',
      'status_characteristic',
      (error, characteristic) => {
        if (error) {
          console.error('Characteristic monitor error:', error);
          return;
        }

        this.updateDeviceStatus(device.id, characteristic.value);
      }
    );
  }

  async updateDeviceStatus(deviceId, status) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) return;

    device.status = status;
    this.connectedDevices.set(deviceId, device);

    // Update smart home state
    this.smartHomeState.set(deviceId, {
      type: device.type,
      status,
      lastUpdated: new Date().toISOString()
    });

    await this.saveSmartHomeState();
  }

  // Smart Home Control
  async controlDevice(deviceId, command) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) throw new Error('Device not found');

    try {
      await device.device.writeCharacteristicWithResponseForService(
        'device_control',
        'control_characteristic',
        btoa(JSON.stringify(command))
      );

      // Update state
      this.updateDeviceStatus(deviceId, {
        ...device.status,
        ...command
      });

      return true;
    } catch (error) {
      console.error('Error controlling device:', error);
      return false;
    }
  }

  async createMoodScene(sceneName, deviceStates) {
    const scene = {
      name: sceneName,
      states: deviceStates,
      createdAt: new Date().toISOString()
    };

    await AsyncStorage.setItem(
      `mood_scene_${sceneName}`,
      JSON.stringify(scene)
    );

    return scene;
  }

  async activateMoodScene(sceneName) {
    const sceneData = await AsyncStorage.getItem(`mood_scene_${sceneName}`);
    if (!sceneData) throw new Error('Scene not found');

    const scene = JSON.parse(sceneData);
    const results = await Promise.all(
      Object.entries(scene.states).map(([deviceId, state]) =>
        this.controlDevice(deviceId, state)
      )
    );

    return results.every(result => result);
  }

  // Persistence
  async savePlayZones() {
    try {
      await AsyncStorage.setItem(
        'play_zones',
        JSON.stringify(Array.from(this.playZones.entries()))
      );
    } catch (error) {
      console.error('Error saving play zones:', error);
    }
  }

  async saveSmartHomeState() {
    try {
      await AsyncStorage.setItem(
        'smart_home_state',
        JSON.stringify(Array.from(this.smartHomeState.entries()))
      );
    } catch (error) {
      console.error('Error saving smart home state:', error);
    }
  }
}

export default new ARIoTSystem();
