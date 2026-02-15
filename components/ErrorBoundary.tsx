import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Flame } from "lucide-react-native";
import { COLORS, FONTS } from "../constants/theme";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <LinearGradient
        colors={[COLORS.voidBlack, "#1a0a2e", COLORS.voidBlack]}
        style={styles.container}
      >
        <View style={styles.iconContainer}>
          <Flame size={48} color={COLORS.fireOrange} strokeWidth={1.5} />
        </View>

        <Text style={styles.heading}>Something went wrong</Text>

        <Text style={styles.subtitle}>
          The connection was interrupted.{"\n"}Stand firm and try again.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={this.handleRetry}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(245,158,11,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  heading: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.slate400,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: COLORS.electricPurple,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: COLORS.electricPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
