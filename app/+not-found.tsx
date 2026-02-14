import { Link, Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Typography } from "../components/ui/Typography";
import { COLORS } from "../constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Typography variant="heading" style={styles.title}>
          This screen doesn't exist.
        </Typography>
        <Link href="/" style={styles.link}>
          <Typography variant="body" style={styles.linkText}>
            Go to home screen
          </Typography>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: COLORS.voidBlack,
  },
  title: {
    color: COLORS.white,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    color: COLORS.electricPurple,
  },
});
