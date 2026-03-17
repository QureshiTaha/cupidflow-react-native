import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  PermissionsAndroid,Platform,Alert,KeyboardAvoidingView,View,TextInput,TouchableOpacity,Text,FlatList,StyleSheet,Keyboard,TouchableWithoutFeedback,
  Modal,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function gifImplement(){
    const key = "ELxqwNsOktIDA0MYnq8gJ9pnc7EsW1WG";
    const [gif,setGif] = useState({}); 
    const apiCall = async()=>{
        const response = await fetch(
            `https://api.giphy.com/v1/gifs/random?api_key=${key}`,
        );
        const json = await response.json();
        setGif({image_url : json.data.images.downsized_large.url});
    };

    useEffect(()=>{
        apiCall();
    },[]);

    return
    {
        
    }
};
