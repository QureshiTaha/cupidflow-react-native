import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, FlatList, Image, Dimensions, ScrollView} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from "react-native-vector-icons/Ionicons";
import LottieView from 'lottie-react-native';
import { ProgressBar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
// import { ScrollView } from 'react-native-web';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.5;
const ITEM_HEIGHT = ITEM_WIDTH * 1.2; // Proportional height
const SIDE_ITEM_SCALE = 0.7; // Side items should appear smaller
const ACTIVE_ITEM_SCALE = 0.9; // Center item should be fully visible

const carouselData = [
    { id: '0', empty: true}, // Placeholder
    { id: '1', image: require('../../../assets/images/bronze-level-carousel.png'), title: 'Bronze Agency' },
    { id: '2', image: require('../../../assets/images/silver-level-carousel.png'), title: 'Silver Agency' },
    { id: '3', image: require('../../../assets/images/gold-level-carousel.png'), title: 'Gold Agency' },
    { id: '4', image: require('../../../assets/images/elite-level-carousel.png'), title: 'Elite Agency' },
    { id: '5', image: require('../../../assets/images/royal-level-carousel.png'), title: 'Royal Agency' },
    { id: '6', empty: true }, // Placeholder
];
const scenarioData = {
    1: {
        criteriaText: "0/2 Criteria Achieved",
        rocketSubtitle: "Achieve monthly criteria to upgrade to Bronze next month",
        showProgressBar: false,
        showCheckmark: false,
        statsAmount: "$0",
        backgroundImage: require("../../../assets/images/background-bronze-dark.png")
    },
    2: {
        criteriaText: "0/3 Criteria Achieved",
        rocketSubtitle: "Achieve monthly criteria to upgrade to Silver next month",
        showProgressBar: true,
        showCheckmark: true,
        statsAmount: "$0/ $20,000",
        backgroundImage: require("../../../assets/images/background-silver-dark.png")
    },
    3: {
        criteriaText: "0/3 Criteria Achieved",
        rocketSubtitle: "Achieve monthly criteria to upgrade to Gold next month",
        showProgressBar: true,
        showCheckmark: true,
        statsAmount: "$0/ $50,000",
        backgroundImage: require("../../../assets/images/background-gold-dark.png")
    },
    4: {
        criteriaText: "0/3 Criteria Achieved",
        rocketSubtitle: "Achieve monthly criteria to upgrade to Elite next month",
        showProgressBar: true,
        showCheckmark: true,
        statsAmount: "$0/ $100,000",
        backgroundImage: require("../../../assets/images/background-platinum-dark.png")
    },
    5: {
        criteriaText: "0/3 Criteria Achieved",
        rocketSubtitle: "Achieve monthly criteria to upgrade to Royal next month",
        showProgressBar: true,
        showCheckmark: true,
        statsAmount: "$0/ $250,000",
        backgroundImage: require("../../../assets/images/background-royal-dark.png")
    }
};
const activeScenario = scenarioData[5];


const getDaysLeftInMonth = () => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the month
    return lastDay.getDate() - today.getDate(); // Remaining days
};

const Agency = () => {
    const [daysLeft, setDaysLeft] = useState(getDaysLeftInMonth());
    const navigation = useNavigation();
    const [activeIndex, setActiveIndex] = useState(1);
    const flatListRef = useRef(null);

    const handleScroll = (event) => {
        let offsetX = event.nativeEvent.contentOffset.x;
        let index = Math.round(offsetX / ITEM_WIDTH);
    
        // Prevent scrolling to id=0
        if (index <= 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                    offset: 0.5 * ITEM_WIDTH, // Move to the position of id=1 smoothly
                    animated: true,
                });
            }, 300); // Short delay for smooth effect
            index = 1;
        }
    
        // Prevent scrolling to id=5
        if (index >= carouselData.length - 1) {
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                    offset: (carouselData.length - 2) * ITEM_WIDTH, // Move to id=4 smoothly
                    animated: true,
                });
            }, 300);
            index = carouselData.length - 2;
        }
    
        setActiveIndex(index);
    };
    
    
    const renderItem = ({ item, index }) => {
        if (item.empty) {
            return <View style={{ width: (width - ITEM_WIDTH) / 1 }} />;
        }
        const isActive = index === activeIndex;
        return (
            <View style={[styles.carouselItem, { transform: [{ scale: isActive ? ACTIVE_ITEM_SCALE : SIDE_ITEM_SCALE }] }]}>
            <Image source={item.image} style={[styles.carouselImage, { opacity: isActive ? 1 : 0.5 }]} />
            {isActive && (
                <View style={styles.titleContainer}>
                    <Text style={styles.carouselTitle}>{item.title}</Text>
                </View>
            )}
        </View>
        );
    };
    

    useEffect(() => {
        // Scroll to the first actual item (index 1) to keep it in the center
        if (flatListRef.current) {
            // Scroll to the first actual item (index 1) to keep it in the center
            setTimeout(() => {
                flatListRef.current.scrollToIndex({ index: 1.5, animated: false });
            }, 100); // Small delay to ensure proper rendering
        }
        const interval = setInterval(() => {
            setDaysLeft(getDaysLeftInMonth());
        }, 86400000); // Update every 24 hours

        
        
        return () => clearInterval(interval);
    }, []);

    const activeId = activeIndex;
    const activeScenario = scenarioData[activeId];

    return (
        <ScrollView style={styles.container}>    
            <ImageBackground source={activeScenario.backgroundImage} style={styles.containerImage} >
                {/* Header */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Agency Program</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('InfoPage')}>
                        <Ionicons name="information-circle" size={24} color="white" />
                    </TouchableOpacity>
                </View>
                
                {/* Fixed Circle */}
                <View style={styles.fixedCircle}>      
                </View>
                {/* Carousel */}
                <FlatList 
                    ref={flatListRef}
                    data={carouselData}
                    horizontal
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    showsHorizontalScrollIndicator={false}
                    snapToAlignment="center"
                    pagingEnabled
                    snapToInterval={ITEM_WIDTH}
                    decelerationRate="fast"
                    onScroll={handleScroll}
                    initialScrollIndex={1}
                    getItemLayout={(data, index) => ({
                        length: ITEM_WIDTH,
                        offset: ITEM_WIDTH * index,
                        index,
                    })}

                />
                {/* Dots Indicator */}
                <View style={styles.dotsContainer}>
                    {carouselData.filter(item => !item.empty).map((_, index) => (
                        <View key={index} style={[styles.dot, activeIndex === index + 1 && styles.activeDot]} />
                    ))}
                </View>
            


            </ImageBackground>
            
            {/* Hero Section */}
            <View style={styles.heroContainer}>
                    
                {/* Criteria Heading */}
                <Text style={styles.criteriaText}>{activeScenario.criteriaText}</Text>

                {/* Rocket Container */}
                <View style={styles.rocketContainer}>
                        {/* <Image source={require("../../../assets/gif/rocket.gif")} style={styles.rocketImage} /> */}
                        <LottieView source={require("../../../assets/gif/rocket.json")} autoPlay loop style={styles.rocketImage} />
                        <View style={styles.rocketTextContainer}>
                            <Text style={styles.rocketTitle}>Act Fast to Upgrade Your Status!</Text>
                            <Text style={styles.rocketSubtitle}>{activeScenario.rocketSubtitle}</Text>
                        </View>
                    </View>

                    {/* Days Left */}
                    <View style={styles.daysLeftContainer}>
                        <TouchableOpacity style={styles.daysLeftButton}>
                            <Ionicons name="time-outline" size={20} color="#9c9c9d" />
                            <Text style={styles.daysLeftText}>{daysLeft} {daysLeft === 1 ? "day" : "days"} left</Text>
                        </TouchableOpacity>
                    </View>
            </View>
            {/* Hero Section */}

            <View style={styles.newSection}>
                <View style={styles.statsContainer}>
                    {/* Stats section start*/}
                    {/* First Progress */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressheader}>
                            <Text style={styles.progressAmount}>{activeScenario.statsAmount}</Text>
                        </View>
                        {activeScenario.showProgressBar && (
                            <View style={styles.progressWrapper}>
                                <View style={styles.progressBarContainer}>
                                    <ProgressBar progress={0} color="#fff" style={styles.progressBar} />
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={styles.checkmarkIcon} />
                                </View>
                            </View>
                        )}
                        <Text style={styles.progressLabel}>Redeemed Revenues</Text>
                    </View>
                    
                    {/* second progress */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressheader}>
                            <Text style={styles.progressAmount}>$0 / $1</Text>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                        </View>
                        <ProgressBar progress={0} color="#fff" style={styles.progressBar} />
                        <Text style={styles.progressLabel}>Monthly Revenue Growth (+4% of Last Month’s)</Text>
                    </View>

                    {/* third progress */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressheader}>
                            <Text style={styles.progressAmount}>0 / 8</Text>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                        </View>
                        <ProgressBar progress={0} color="#fff" style={styles.progressBar} />
                        <Text style={styles.progressLabel}>First-Time Redeemers</Text>
                    </View>

                    {/* Stats section end*/}

                    {/* Agency Card Section */}
                    <View style={styles.agencyCard}>
                        <View style={styles.agencyHeader}>
                            <Image source={require('../../../assets/images/agency-rookie-level.png')} style={styles.agencyIcon} />
                            <View style={styles.agencyTextContainer}>
                            <Text style={styles.agencyTitle}>Rookie Agency</Text>                        
                            <Text style={styles.agencyShare}>5% Revenue Share</Text>
                            </View>
                            <TouchableOpacity style={styles.tiersButton}>
                                <Text style={styles.tiersText}>Tiers</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.earningsContainer}>
                            <View style={styles.earningsBox}>
                                <Text style={styles.earningsLabel}>This Month's Earnings</Text>
                                <Text style={styles.earningsAmount}>💎 0</Text>
                            </View>
                            <View style={styles.earningsBox}>
                                <Text style={styles.earningsLabel}>Lifetime Earnings</Text>
                                <Text style={styles.earningsAmount}>💎 0</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.referText}>Refer & Earn</Text>
                    
                    {/* First Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Up to 15% Diamonds from {"\n"} <Text style={styles.boldText}>Earnings</Text></Text>
                            <Ionicons name="link-outline" size={18} color="#fff" />
                        </View>
                        <Text style={styles.cardDescription}>
                            Get up to 1,500% 💎 of Referred Creators' withdrawals for 2 years
                        </Text>
                        <TouchableOpacity activeOpacity={0.8} style={styles.buttonWrapper}>
                            <LinearGradient 
                                colors={["#ff416c", "#ff4b2b"]} 
                                start={{ x: 0, y: 0 }} 
                                end={{ x: 1, y: 1 }} 
                                style={styles.customGradientButton}
                            >
                                <Text style={styles.buttonText}>Invite Creators</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                    </View>

                    {/* Second Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>+5% Diamonds from {"\n"} <Text style={styles.boldText}>Spendings</Text></Text>
                            <Ionicons name="link-outline" size={18} color="#fff" />
                        </View>
                        <Text style={styles.cardDescription}>
                            Get 5% 💎 of Referred Supporters' purchases for 6 months
                        </Text>
                        <TouchableOpacity style={styles.inviteButtonOutlined}>
                            <Text style={styles.buttonTextOutlined}>Invite Supporters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 'auto',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: "transparent",
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    carouselItem: {
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        
    },
    containerImage: {
        resizeMode: 'cover',
    },
    fixedCircle: {
        position: 'absolute',
        top: '35%', // Adjust based on design
        left: '46%',
        width: 130, // Slightly increased size
        height: 130,
        borderRadius: 65, // Make it a perfect circle
        borderWidth: 4, // Increased border thickness for a bold look
        borderColor: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Soft translucent background
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateX: -50 }, { scale: 1.1 }], // Centering and slight enlargement
        zIndex: 0, // Keep it above the carousel
        shadowColor: '#000', // Shadow effect for depth
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 10, // Adds shadow effect for Android
    },
    carouselImage: {
        width: 90, // Slightly larger image for better visibility
        height: 90,
        opacity: 0.8, // Increase visibility
        resizeMode: 'contain',
    },
    
    
    titleContainer: {
        marginTop: 0,
        backgroundColor: 'white',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    carouselTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'black',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 0,
        marginBottom: "5%",
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'gray',
        marginHorizontal: 4,
    },
    activeDot: {    
        backgroundColor: 'red',
        width : 10,
        height : 10
    },
    
    heroContainer: {
        backgroundColor: 'black',
        padding: 20,
    },
    criteriaText: {
        color: "white",
        fontSize: 20,
        textAlign: "center",
        marginBottom: 15,
    },
    rocketContainer: {
        flexDirection: "row",
        backgroundColor: "white",
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#fff",
        overflow: "hidden",
        
    },
    rocketImage: {
        width: 50,
        height: 50,
    },
    rocketTextContainer: {
        marginLeft: 10,
        // flex: 1,
        maxWidth: "80%",
    },
    rocketTitle: {
        color: "black",
        fontWeight: "bold",
        fontSize: 16,
    },
    rocketSubtitle: {
        color: "gray",
        flex: "wrap",
        fontSize: 14,
    },
    daysLeftContainer: {
        alignItems: "center",
        marginTop: 20,
    },
    daysLeftButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1f1f1f",
        padding: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#9c9c9d",
    },
    daysLeftText: {
        color: "#9c9c9d",
        marginLeft: 5,
    }, 
    // New Section Styles
    statsContainer: {
        backgroundColor: "#111",
        padding: 20,
        // borderRadius: 10,
        // marginTop: 20,
    },
    statsAmount: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
    },
    statsLabel: {
        color: "#bbb",
        fontSize: 14,
        marginBottom: 15,
    },
    progressContainer: {
        borderTopWidth: 1,
        borderTopColor: "#444",
        paddingVertical: 10,
    },
    progressheader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    progressBarContainer: {
        position: "relative",
        width: "100%", // Ensures it takes full width
    },
    checkmarkIcon: {
        position: "absolute",
        top: -20, // Adjust position upwards
        right: 0, // Align to the right
    },
    
    progressAmount: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    progressLabel: {
        color: "#aaa",
        fontSize: 13,
    },
    progressBar: {
        height: 5,
        borderRadius: 5,
        marginBottom: 2,
        marginTop: 5,
      },
    agencyCard: {
        backgroundColor: "#222",
        borderRadius: 10,
        padding: 15,
        marginTop: 15,
    },
    agencyHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    agencyIcon: {
        width: 50,
        height: 50,
    },
    agencyTextContainer: {
        marginLeft: 10,
        flex: 1,
    },
    agencyTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    tiersButton: {
        backgroundColor: "#444",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    tiersText: {
        color: "#fff",
        fontSize: 14,
    },
    agencyShare: {
        color: "#bbb",
        fontSize: 14,
    },
    earningsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: "#444",
        paddingVertical: 10,
    },
    earningsBox: {
        alignItems: "center",
        flex: 1,
    },
    earningsLabel: {
        color: "#bbb",
        fontSize: 13,
    },
    earningsAmount: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 5,
    },
    referText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 10,
    },
    card: {
        backgroundColor: "#111",
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        marginTop: 15,
        borderWidth: 1,
        borderColor: "#333",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    cardTitle: {
        color: "#fff",
        fontSize: 16,
    },
    boldText: {
        fontWeight: "bold",
    },
    cardDescription: {
        color: "#ccc",
        fontSize: 14,
        marginBottom: 10,
    },
    inviteButton: {
        borderRadius: 20,
        paddingVertical: 10,
        alignItems: "center",
    },
    buttonWrapper: {
        borderRadius: 20, // Ensures smooth edges
        overflow: "hidden", // Prevents gradient overflow
    },
    customGradientButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#ff4b2b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 5, // For Android shadow effect
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    inviteButtonOutlined: {
        borderRadius: 20,
        paddingVertical: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#fff",
    },
    buttonTextOutlined: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
    },
});

export default Agency;
