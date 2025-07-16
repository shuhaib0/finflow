
'use client'

import { useState } from "react"
import { SendHorizonal, Bot, User, Sparkles } from "lucide-react"
import { useForm, SubmitHandler } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { handleQuestion } from "./actions"
import { useAuth } from "@/app/(protected)/auth-provider"

type Message = {
  role: "user" | "assistant"
  content: string
}

type FormValues = {
  query: string
}

export default function QnaPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI finance assistant. Ask me anything about your financial data.",
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, reset } = useForm<FormValues>()

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!data.query || isLoading || !user) return
    
    setIsLoading(true)
    const userMessage: Message = { role: "user", content: data.query }
    setMessages((prev) => [...prev, userMessage])
    reset()

    try {
      const assistantResponse = await handleQuestion(data.query, user.uid)
      const assistantMessage: Message = { role: "assistant", content: assistantResponse }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = { role: "assistant", content: "Sorry, I encountered an error. Please try again." }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-theme(spacing.24))]">
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent" />
                AI Finance Q&A Agent
            </CardTitle>
            <CardDescription>Ask questions about your financial data in plain English.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
                <div className="space-y-6">
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={`flex items-start gap-3 ${
                        message.role === "user" ? "justify-end" : ""
                    }`}
                    >
                    {message.role === "assistant" && (
                        <Avatar className="h-9 w-9 border-2 border-accent">
                            <AvatarFallback>
                                <Bot className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <div
                        className={`max-w-md rounded-lg p-3 ${
                        message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                    >
                        <p className="text-sm">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>
                                <User className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                    )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 border-2 border-accent">
                            <AvatarFallback>
                                <Bot className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="max-w-md rounded-lg p-3 bg-muted">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-foreground/50 animate-pulse delay-0"></span>
                                <span className="h-2 w-2 rounded-full bg-foreground/50 animate-pulse delay-150"></span>
                                <span className="h-2 w-2 rounded-full bg-foreground/50 animate-pulse delay-300"></span>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
        </CardContent>
        <CardFooter className="pt-4 border-t">
            <form onSubmit={handleSubmit(onSubmit)} className="flex w-full items-center space-x-2">
                <Input
                    {...register("query")}
                    placeholder="e.g., Show revenue in June..."
                    autoComplete="off"
                    disabled={isLoading || !user}
                />
                <Button type="submit" size="icon" disabled={isLoading || !user}>
                    <SendHorizonal className="h-4 w-4" />
                </Button>
            </form>
        </CardFooter>
    </Card>
  )
}
