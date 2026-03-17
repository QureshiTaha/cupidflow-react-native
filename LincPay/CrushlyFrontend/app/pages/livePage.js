import React from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

export default function LivePage() {
  return (
    <View style={{ flex: 1 }}>
      <WebView 
        source={{ uri: "https://google.com" }} 
        style={{ flex: 1 }} 
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}
