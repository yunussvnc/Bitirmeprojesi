import { router } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = () => {
    // Expo Router kullanıyoruz
    // Tabs yapısına geç
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Background Image with Overlay */}
          <View style={styles.backgroundContainer}>
            {/* Background Image */}
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&q=80",
              }}
              style={styles.backgroundImage}
              contentFit="cover"
              transition={300}
            />

            {/* Light Overlay Gradient */}
            <LinearGradient
              colors={[
                "rgba(255, 245, 247, 0.95)",
                "rgba(248, 249, 250, 0.98)",
                "rgba(255, 255, 255, 0.95)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.overlayGradient}
            />

            {/* Animated Background Elements */}
            <View style={styles.backgroundElements}>
              <View style={[styles.circle, styles.circle1]} />
              <View style={[styles.circle, styles.circle2]} />
              <View style={[styles.circle, styles.circle3]} />
            </View>

            {/* Content Container */}
            <View style={styles.container}>
              {/* Logo/Icon Section */}
              <View style={styles.logoSection}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoEmoji}>📍</Text>
                </View>
                <Text style={styles.appName}>MekanKeşif</Text>
                <Text style={styles.tagline}>Yapay Zeka ile Mekan Bul</Text>
              </View>

              {/* Form Card */}
              <View style={styles.cardContainer}>
                <BlurView intensity={20} style={styles.card}>
                  {/* Header */}
                  <View style={styles.header}>
                    <Text style={styles.title}>Hoş Geldin! 👋</Text>
                    <Text style={styles.subtitle}>
                      En iyi mekanları keşfetmeye hazır mısın?
                    </Text>
                  </View>

                  {/* Form */}
                  <View style={styles.form}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>E-posta</Text>
                      <TextInput
                        placeholder="ornek@email.com"
                        placeholderTextColor="#999"
                        style={styles.input}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Şifre</Text>
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor="#999"
                        style={styles.input}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.button}
                      onPress={onLogin}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={["#667eea", "#764ba2"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.buttonText}>Giriş Yap</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>veya</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Social Login Buttons */}
                  <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialButton}>
                      <Text style={styles.socialButtonText}>📱 Google ile Giriş</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Footer */}
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>
                      Hesabın yok mu?{" "}
                      <Text
                        style={styles.footerLink}
                        onPress={() => router.push("/register")}
                      >
                        Kayıt Ol
                      </Text>
                    </Text>
                  </View>
                </BlurView>
              </View>

              {/* Bottom Decorative Elements */}
              <View style={styles.bottomElements}>
                <Text style={styles.bottomText}>
                  🎓 Öğrenci İndirimleri • 📍 Konum Bazlı • 🤖 AI Öneriler
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backgroundContainer: {
    flex: 1,
    width: width,
    minHeight: height,
    position: "relative",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundElements: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    opacity: 0.1,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: "#fff",
    top: -100,
    right: -50,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: "#fff",
    bottom: 100,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: "#fff",
    top: "40%",
    right: 50,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "center",
    zIndex: 1,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 50,
  },
  appName: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 17,
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardContainer: {
    marginBottom: 30,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backdropFilter: "blur(20px)",
  },
  header: {
    marginBottom: 28,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    color: "#111",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#999",
    fontSize: 14,
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  footer: {
    marginTop: 24,
  },
  footerText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },
  footerLink: {
    color: "#667eea",
    fontWeight: "700",
  },
  bottomElements: {
    alignItems: "center",
    marginTop: 20,
  },
  bottomText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
