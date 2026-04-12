"use client";

import { useState } from "react";
import { UserPlus, Search, Tags, Truck, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    id: "register",
    title: "1. Register your account",
    description: "Create an account, add a valid credit card and upload your resale certificate.",
    icon: UserPlus,
  },
  {
    id: "browse",
    title: "2. Browse listings",
    description: "Search thousands of listings updated multiple times daily.",
    icon: Search,
  },
  {
    id: "offer",
    title: "3. Offer or buy",
    description: "Place an offer to negotiate the listed price or buy now to secure a pallet instantly.",
    icon: Tags,
  },
  {
    id: "checkout",
    title: "4. Check out and ship",
    description: "Enter your payment details, tell us where to send your order, and choose from our carriers. We’ll handle the rest.",
    icon: Truck,
  },
];

export default function HowItWorksTabs() {
  const [activeTab, setActiveTab] = useState(steps[0].id);

  const activeStep = steps.find((step) => step.id === activeTab) || steps[0];
  const ActiveIcon = activeStep.icon;

  return (
    <div className="w-full max-w-5xl mx-auto my-16 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[400px]">
        
        {/* Left Side: Tabs List */}
        <div className="md:col-span-5 bg-gray-50/50 p-6 md:p-8 flex flex-col justify-center space-y-2 border-r border-gray-100">
          <h3 className="text-sm font-bold tracking-widest text-primary uppercase mb-4 px-4">The Process</h3>
          {steps.map((step) => {
            const isActive = activeTab === step.id;
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setActiveTab(step.id)}
                className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-300 flex items-center space-x-4 ${
                  isActive
                    ? "bg-white shadow-sm border border-gray-100"
                    : "hover:bg-gray-100/50 border border-transparent text-gray-500"
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${isActive ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`font-semibold text-lg transition-colors ${isActive ? "text-gray-900" : "text-gray-600"}`}>
                  {step.title}
                </span>
                {isActive && (
                  <motion.div layoutId="active-indicator" className="ml-auto">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: Tab Content */}
        <div className="md:col-span-7 bg-white p-8 md:p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
          {/* Subtle background gradient blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="flex flex-col items-center max-w-md relative z-10"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-8 shadow-inner border border-white">
                <ActiveIcon className="w-12 h-12 sm:w-16 sm:h-16 text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{activeStep.title.split('. ')[1]}</h2>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                {activeStep.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
