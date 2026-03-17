import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList } from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from '../components/footer';

export default function ExploreMore() {
    const router = useRouter();
    const [videos, setVideos] = useState([]);
    const [msg, setMsg] = useState("loading...");

    useEffect(() => {
        const fetchVideos = async () => {
            setVideos([
                { id: "1", title: "Product 1", price: "Rs. 100" },
                { id: "2", title: "Product 2", price: "Rs. 200" },
                { id: "3", title: "Product 3", price: "Rs. 300" },
                { id: "4", title: "Product 4", price: "Rs. 400" },
                { id: "5", title: "Product 5", price: "Rs. 500" },
                { id: "6", title: "Product 6", price: "Rs. 600" },
                { id: "7", title: "Product 7", price: "Rs. 700" },
                { id: "8", title: "Product 8", price: "Rs. 800" },
                { id: "9", title: "Product 9", price: "Rs. 900" },

            ]);
            setMsg("No related videos found");
        }
        fetchVideos();
    }, []);


    const VideoList = () => {
        return (
            !videos.length ? <Text style={styles.textMsg}>{msg}</Text> :
                <>
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialIcon style={styles.back} name="arrow-back" size={34} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Title Name according to Prop</Text>
                    <FlatList
                        data={videos}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <Image
                                    style={styles.image}
                                    source={require("../../assets/images/flower.jpg")}
                                />
                            </View>)}
                    />
                </>
        );
    };

    return (
        <>
            {/* <Header /> */}
            <FlatList
                ListHeaderComponent={
                    <SafeAreaView>
                        {/* <View style={styles.containerTop}>
                            <MaterialIcon style={styles.icon} name="thumb-up" size={24} color="#000" />
                            <Text style={styles.text}>No one you're following is live</Text>
                        </View>
                        <View style={styles.containerMid}>
                            <Text style={styles.text}>You may also like</Text>
                        </View> */}
                    </SafeAreaView>
                }
                data={[{ key: "VideoList" }]} // Placeholder data
                renderItem={() => <VideoList userID={null} />}
                keyExtractor={(item) => item.key}
            />
            <View style={styles.containerFloat}>
                <Image style={styles.image} source={require("../../assets/images/video-camera.png")} />
            </View>
            <Footer />
        </>
    );
}

const styles = StyleSheet.create({
    containerTop: {
        display: "flex",
        alignItems: "center",
    },
    containerMid: {
        display: "flex",
        justifyContent: "center",
        alignItems: "left",
        padding: 20
    },
    icon: {
        justifyContent: "center",
        alignItems: "center",
        fontSize: 100,
        padding: 30,
        paddingBottom: 20
    },
    button: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        fontSize: 20,
        color: "#000"
    },
    containerFloat: {
        position: "absolute",
        bottom: 50,
        left: "50%",
        transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
    },
    image: {
        justifyContent: "center",
        width: 70,
        height: 70,
    },
    card: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: "50%",  // Adjust width to fit the screen better
        height: 300,
        padding: 10,
        margin: "auto",
        minHeight: 350,
        backgroundColor: '#fff',
    },
    text: {
        fontWeight: 'bold',
        textAlign: 'center',
        flexWrap: 'nowrap'
    },
    textMsg: {
        fontWeight: 'bold',
        textAlign: 'center',
        flexWrap: 'nowrap',
        fontSize: 20,
        marginTop: 50
    },
    image: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    back: {
        fontSize: 30,
        fontWeight: 'bold',
        top: 10
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginLeft: 50
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%',
    },
}
);