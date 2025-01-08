"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import Loader from "../loader";
import { AutomationDuoToneWhite } from "@/icons";
import { useCreateAutomation } from "@/hooks/use-automations";
import { v4 } from "uuid";

type Props = {};

const name = "Untitled";
const mutationId = v4();

const CreateAutomation = (props: Props) => {
  const { isPending, mutate } = useCreateAutomation(mutationId);
  console.log("mutationId ---> ", mutationId);

  return (
    <Button
      className="lg:px-10 py-6 bg-gradient-to-br hover:opacity-80 text-white rounded-full from-[#3352CC] font-medium to-[#1C2D70]"
      onClick={() =>
        mutate({
          name,
          id: mutationId,
          createdAt: new Date(),
          keywords: [],
        })
      }
    >
      <Loader state={isPending}>
        <AutomationDuoToneWhite />
        <p className="lg:inline hidden">Create an Automation</p>
      </Loader>
    </Button>
  );
};

export default CreateAutomation;
