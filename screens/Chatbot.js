import React, { Component } from 'react';
import { StyleSheet, Text, View ,TouchableOpacity} from 'react-native';
import { GiftedChat  } from 'react-native-gifted-chat';
import { Dialogflow_V2 } from 'react-native-dialogflow';
import { dialogflowConfig } from '../env';
import { withFirebaseHOC } from '../config/Firebase'
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import { Icon } from 'react-native-elements'
import * as Permissions from 'expo-permissions';
import axios from "axios";

console.disableYellowBox=true;
 const BOT_USER = {
    _id: 2,
    name: 'escapism bot',
    //avatar: 'https://i.imgur.com/7k12EPD.png'
  };


  class Chatbot extends Component {
    state = {

      messages: [],
      userDetails: [],
      //is_picking_video: false,


    };

    componentDidMount() {
       this.fetchUserChat(),
      this.fetchUserDetails(),
      Dialogflow_V2.setConfiguration(
        dialogflowConfig.client_email,
        dialogflowConfig.private_key,
        Dialogflow_V2.LANG_ENGLISH_US,
        dialogflowConfig.project_id
      );
    };

    fetchUserDetails = async () => {
      try {
           var userDetails = await this.props.firebase.getUserDetails();
           this.setState({ userDetails })
           // console.log('USER DETAILS ===========>>', userDetails)
         } catch (error) {
        console.log(error)
       }
    };

    fetchUserChat = async () => {
      try {
           var messages = await this.props.firebase.fetchChat();
           this.setState({ messages})
           console.log('USER chat ===========>>', messages)
         } catch (error) {
        console.log(error)
       }
    };

    postMsg = async (msg) => {

   const form = new FormData()
   form.append('api_key', 'slMrROo1PbxnRejhauzT2UU2oCWR0MWWgxRG4wgmPMc')
   form.append('text', msg)
   form.append('lang_code', 'en')

    axios({
      "method": "POST",
      "url": "https://apis.paralleldots.com/v5/emotion",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      "data": form,
      "params":form,

     }).then((response) => {
        let emoObject = response.data.emotion;
        var emoition = Object.keys(emoObject).reduce((a, b) => emoObject[a] > emoObject[b] ? a : b);
        console.log(emoition);
       this.props.firebase.saveEmo(emoition);
    }).catch((err) => {
     console.log("ERROR: ====", err);
   });

    };

    handleGoogleResponse(result) {
      let text  = result.queryResult.fulfillmentMessages[0].text.text[0];
      this.sendBotResponse(text);
    };
    onSend = async (messages = []) => {
      this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, messages)
      }));
      let message = messages[0].text;
       this.postMsg(message);


      Dialogflow_V2.requestQuery(
        message,
        result => this.handleGoogleResponse(result),
        error => console.log(error)
      );
      let msg  = messages[0];
       await this.props.firebase.pushMessage(msg);

    };
 sendBotResponse = async (text) => {
      let msg = {
        _id: this.state.messages.length + 1,
        text,
        createdAt: new Date(),
        user: BOT_USER
      };
      this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, [msg])
      }));
       await this.props.firebase.pushMessage(msg);

    };
    Camerashow = async () => {
    await Permissions.askAsync(Permissions.CAMERA_ROLL, Permissions.CAMERA);
    this.props.navigation.navigate('Camera')
  };
    renderCustomActions = () => {
    // if (!this.state.is_picking_video) {

      return (
        <View style={styles.customActionsContainer}>
          <TouchableOpacity onPress={this.Camerashow}>
            <View style={styles.buttonContainer}>
            <Icon
              name='camera'
              color='black' />
               </View>
          </TouchableOpacity>
        </View>
      );
    // }


  }


    render() {
      const { userDetails , messages } = this.state

      return (
        <View style={{ flex: 1, backgroundColor: '#FBF0D2' }}>
          <GiftedChat
            showUserAvatar = 'true'
            isTyping = 'true'
            placeholder = 'chat with me'
            messages={this.state.messages}
            onSend={messages => this.onSend(messages)}
            user={{
              _id: 1,
              createdAt: new Date(),
              name: userDetails[0],
              email:  userDetails[1],
              avatar: userDetails[2],
              id:  userDetails[3],
            }}
            renderActions={this.renderCustomActions}

          />
        </View>
      );
    }
  }
  const styles = StyleSheet.create({
    customActionsContainer: {
     flexDirection: "row",
     justifyContent: "space-between"
   },
   buttonContainer: {
     padding: 10
   },
  })
export default withFirebaseHOC(Chatbot);
