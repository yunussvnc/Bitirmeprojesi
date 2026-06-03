/**
 * Create Bottom Sheet for Profile 
 * 
 * Shows a bottom sheet when clicking the '+' icon
 */

import React from "react";
import { useRouter } from "expo-router";
import { CreateTypeSheet, type CreateType } from "@/src/components/domain/feed/components/CreateTypeSheet";

export interface CreateBottomSheetProps {
    visible: boolean;
    onClose: () => void;
}

export function CreateBottomSheet({ visible, onClose }: CreateBottomSheetProps) {
    const router = useRouter();

    const handleSelect = (type: CreateType) => {
        if (type === "post") {
            router.push({ pathname: "/create-post", params: { preSelect: "post" } } as any);
        } else if (type === "story") {
            router.push("/create-story" as any);
        }
    };

    return <CreateTypeSheet visible={visible} onClose={onClose} onSelect={handleSelect} />;
}
