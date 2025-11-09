import React from "react";
import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { getOrCreateConversation } from "@/lib/conversation";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { MediaRoom } from "@/components/media-room";

interface MemberIdPageProps {
  params: {
    memberId: string;
    serverId: string;
  };
  searchParams: {
    video?: boolean;
  };
}

export default async function MemberIdPage({
  params: { memberId, serverId },
  searchParams: { video }
}: MemberIdPageProps) {
  const profile = await currentProfile();

  if (!profile) return redirectToSignIn();

  const currentMember = await db.member.findFirst({
    where: {
      serverId,
      profileId: profile.id
    },
    include: {
      profile: true
    }
  });

  if (!currentMember) return redirect("/");

  const conversation = await getOrCreateConversation(
    currentMember.id,
    memberId
  );

  if (!conversation) return redirect(`/servers/${serverId}`);

  const { memberOne: profileOne, memberTwo: profileTwo } = conversation;

  // ✅ Fixed: use `.id`, not `.profileId`
  const otherMember = profileOne.id === profile.id ? profileTwo : profileOne;

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        imageUrl={otherMember.imageUrl}
        name={otherMember.name}
        serverId={serverId}
        type="conversation"
      />
      {video && <MediaRoom chatId={conversation.id} video audio />}
      {!video && (
        <>
          <ChatMessages
            member={currentMember}
            name={otherMember.name}
            chatId={conversation.id}
            type="conversation"
            apiUrl="/api/direct-messages"
            paramKey="conversationId"
            paramValue={conversation.id}
            socketUrl="/api/socket/direct-messages"
            socketQuery={{
              conversationId: conversation.id
            }}
          />
          <ChatInput
            name={otherMember.name}
            type="conversation"
            apiUrl="/api/socket/direct-messages"
            query={{
              conversationId: conversation.id
            }}
          />
        </>
      )}
    </div>
  );
}
