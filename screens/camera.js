import React, { Component } from "react";
import { View, Text, TouchableOpacity, Alert, Button, Image, StyleSheet, YellowBox } from "react-native";
import { FontAwesome, Ionicons,MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import delay from 'delay';
import * as VideoThumbnails from 'expo-video-thumbnails';
import MediaMeta from 'react-native-media-meta';
import _ from 'lodash';
import Constants from 'expo-constants';
import { withFirebaseHOC } from '../config/Firebase';


YellowBox.ignoreWarnings(['Setting a timer']);
const _console = _.clone(console);
console.warn = message => {
  if (message.indexOf('Setting a timer') <= -1) {
    _console.warn(message);
  }
};

const verifyPermissions = async () => {
  const result = await Permissions.askAsync(Permissions.AUDIO_RECORDING, Permissions.CAMERA_ROLL);
    if (result.status !== 'granted') {
      Alert.alert(
        'Insufficient permissions!',
        'You need to grant camera permissions to use this app.',
        [{ text: 'Okay' }]
      );
      return false;
    }
    return true;
};

const printChronometer = seconds => {
  const minutes = Math.floor(seconds / 60);
  const remseconds = seconds % 60;
  return '' + (minutes < 10 ? '0' : '') + minutes + ':' + (remseconds < 10 ? '0' : '') + remseconds;
};

class MyCam extends Component {
  state = {
    video: null,
    picture: null,
    type: Camera.Constants.Type.back,
    duration: 0,
    allowsEditing: true,
    image: null,
    recording: false
  };

  registerRecord = async () => {
    const { recording, duration } = this.state;

    if (recording) {
      await delay(1000);
      this.setState(state => ({
        ...state,
        duration: state.duration + 1
      }));
      if (duration == 9 ) {
        this.setState({ recording: false }, () => {
          this.cam.stopRecording();
        });
      }
      this.registerRecord();
    }
  }

  _saveVideo = async () => {
    const { video } = this.state;
    const asset = await MediaLibrary.createAssetAsync(video.uri);
    const hasPermission = await verifyPermissions();
    if (!hasPermission) {
        return;
    }

    if (!asset.cancelled){
      this.props.firebase.uploadVideo(video.uri)
      .then(() => {
        Alert.alert("Success");
      })
      .catch((error) =>{
        Alert.alert("error");
      });
    }

    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        video.uri,
        {
          time: 1000,
        }
      );
      this.setState({ image: uri });
    } catch (e) {
      console.warn(e);
    }


    if (asset) {
      this.setState({ video: null });
    }
  };

  _StopRecord = async () => {
    const hasPermission = await verifyPermissions();
    if (!hasPermission) {
        return;
    }
    this.setState({ recording: false }, () => {
      this.cam.stopRecording();
    });
  };

  _StartRecord = async () => {
    const hasPermission = await verifyPermissions();
    const { duration } = this.state;
    if (!hasPermission) {
        return;
    }
    if (this.cam) {
      this.setState({ recording: true }, async () => {
        this.registerRecord();
        const video = await this.cam.recordAsync({
          quality: '720p',
        });
        //MediaMeta.get(path)
        //.then((metadata) => {
        //  if (metadata.duration > maxTime ) {
        //    Alert.alert(
        //      'Sorry',
        //      'Video duration must be less then 10 seconds',
        //      [
        //        { text: 'OK', onPress: () => console.log('OK Pressed') }
        //      ],
        //      { cancelable: false }
        //    );
        //  } else {
        //    // Upload or do something else
        //  }
        //}).catch(err => console.error(err));

        this.setState({ video });

      });
    }

  };

  toogleRecord = async () => {
    const { recording } = this.state;
    const hasPermission = await verifyPermissions();
    if (!hasPermission) {
        return;
    }
    if (recording) {
      this._StopRecord();
    } else {
      this._StartRecord();
    }
  };

  flipCamera = async () => {
    let ratios = ['4:3'], ratio = '4:3';
    try {
      ratios = await this.cam.getSupportedRatiosAsync();
    } catch (err) {
      ratios = ['4:3'];
    }
    console.log(ratios);
    if (ratios.indexOf('16:9') != -1) {
      ratio = '16:9';
    }

    this.setState({
      type: this.state.type === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back,
      ratio: ratio,
    });
  };

  switchType = async () => {
    const hasPermission = await verifyPermissions();
    if (!hasPermission) {
        return;
    }
    let newType;
    const { back, front } = Camera.Constants.Type;

    if (this.state.type === back) {
      newType = front;
    } else if (this.state.type === front) {
      newType = back;
    }

    this.setState({
        ...this.state,
        type: newType,
    });
  };

  choosePhotoFromLibrary = async () => {
    ImagePicker.launchImageLibraryAsync(  {
      width: 300,
      height: 400,
      mediaTypes:'Videos',

      cropping: true
    }).then(  video => {
      console.log(video);
      if (!video.cancelled){
        this.props.firebase.uploadVideo(video.uri)
        .then(() => {
          Alert.alert("Success");
        })
        .catch((error) =>{
          Alert.alert("error");
        });
      }
    });

    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        video.uri,
        {
          time: 1000,
        }
      );
      this.setState({ image: uri });
    } catch (e) {
      console.warn(e);
    }
  };


  render() {
    const { recording, video, duration } = this.state;
    const { image } = this.state;
    return (
      <Camera
        ref={cam => (this.cam = cam)}
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          flex: 1,
          width: "100%"
        }}
        type={this.state.type}
      >
        {video && (
          <TouchableOpacity
            onPress={this._saveVideo}
            style={{
              padding: 20,
              width: "30%",
              backgroundColor: "#fff"
            }}
          >
            <Text style={{ textAlign: "center" }}>save</Text>
          </TouchableOpacity>
        )}

        <Text
        style={{
          padding: 20,
          width: "45%",
          backgroundColor: "#fff"
        }}
        >Generate thumbnail</Text>

        <TouchableOpacity
          onPress={this.toogleRecord}
          style={{
            padding: 20,
            width: "30%",
            marginBottom: -78,
            backgroundColor: recording ? "#ef4f84" : "#4fef97"
          }}
        >
          <Text style={{ textAlign: "center" }}>
            {recording ? "Stop" : "Record"}
          </Text>
        </TouchableOpacity>

        {image && <Image onPress={this._saveVideo} source={{ uri: image }} style={{
          width: 200,
          height: 200,
          marginBottom: -78,
          }}
          />}
        <TouchableOpacity
            onPress={()=>this.switchType()}
            style={{
              alignSelf: 'flex-end',
              alignItems: 'center',
              backgroundColor: 'transparent',
              marginBottom: -5,
            }}
            >
            <MaterialCommunityIcons
                name="camera-switch"
                style={{ color: "#fff", fontSize: 40}}
            />
        </TouchableOpacity>
        <TouchableOpacity onPress={this.choosePhotoFromLibrary}
            style={{
              alignSelf: 'flex-end',
              alignItems: 'center',
              backgroundColor: 'transparent',
              marginBottom: -60,
            }}
            >
            <MaterialCommunityIcons name="camera-burst" style={{ color: "#fff", fontSize: 40}}/>
        </TouchableOpacity>
        <Text
        style={{
          alignSelf: 'flex-start',
          padding: 20,
          width: "22%",
          backgroundColor: "#fff"
        }}
        >{printChronometer(duration)}</Text>
      </Camera>
    );
  }
}

class CameraVideo extends Component {
  state = {
    image: null,
    showCamera: false
  };

  _showCamera = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL, Permissions.CAMERA);

    if (status === "granted") {
      this.setState({ showCamera: true });
    }
  };

  render() {
    const { showCamera } = this.state;
    const { image } = this.state;
    return (
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          width: "100%"
        }}
      >
        {showCamera ? (
          <MyCam />
        ) : (

          <TouchableOpacity onPress={this._showCamera}>
            <Text> Show Camera </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

export default withFirebaseHOC(MyCam);
