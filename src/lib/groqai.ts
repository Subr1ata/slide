import Groq from "groq-sdk";

export const groqai = new Groq({
  apiKey: process.env["GROQ_API_KEY"], // This is the default and can be omitted
});
