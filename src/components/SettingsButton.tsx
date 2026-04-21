"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { useCustomization } from "@/context/CustomizationContext";

export default function SettingsButton() {
  const { toggleSidebar, sidebarOpen } = useCustomization();

  return (
    <motion.button
      onClick={toggleSidebar}
      className="settings-fab"
      aria-label="Open customization panel"
      title="Customize"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      animate={{ rotate: sidebarOpen ? 90 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Settings size={20} strokeWidth={1.5} />
    </motion.button>
  );
}
