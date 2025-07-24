"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Brush,
  Download,
  Palette,
  Play,
  RefreshCw,
  Trash2,
  LoaderCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { DoodleCanvas, type DoodleCanvasRef } from "@/components/doodle-canvas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { prompts } from "@/lib/prompts";
import { doodleQualityCheck, type DoodleQualityCheckOutput } from "@/ai/flows/doodle-quality-check";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const COLORS = [
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];
const GAME_DURATION = 60; // 60 seconds

export default function DoodleDashPage() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const canvasRef = useRef<DoodleCanvasRef>(null);
  const [prompt, setPrompt] = useState<string>("Ready to draw?");
  const [color, setColor] = useState<string>(COLORS[0]);
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [timer, setTimer] = useState<number>(GAME_DURATION);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiResult, setAiResult] = useState<DoodleQualityCheckOutput | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  
  const { toast } = useToast();

  const handleStartGame = useCallback(() => {
    setGameState("playing");
    const newPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    setPrompt(newPrompt);
    canvasRef.current?.clear();
    setTimer(GAME_DURATION);
    setIsResultOpen(false);
    setAiResult(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setGameState("finished");
    
    const dataUrl = canvasRef.current?.getDataUrl();
    if (dataUrl) {
      setIsLoadingAI(true);
      setIsResultOpen(true);
      try {
        const result = await doodleQualityCheck({ photoDataUri: dataUrl });
        setAiResult(result);
      } catch (error) {
        console.error("AI check failed", error);
        setIsResultOpen(false);
        toast({
          title: "Error",
          description: "Could not check doodle quality. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAI(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    if (gameState === "playing") {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState, handleSubmit]);

  const progress = (timer / GAME_DURATION) * 100;

  return (
    <TooltipProvider>
      <main className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen font-sans">
        {gameState === 'idle' ? (
          <div className="text-center flex flex-col items-center gap-6">
            <h1 className="text-6xl font-bold text-primary font-headline">Doodle Dash</h1>
            <p className="text-xl text-muted-foreground max-w-md">
              Unleash your creativity in a timed drawing challenge. Ready to sketch?
            </p>
            <Button size="lg" onClick={handleStartGame} className="font-bold text-lg gap-2">
              <Play />
              Start Drawing
            </Button>
          </div>
        ) : (
          <Card className="w-full max-w-4xl shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="p-4 bg-card-foreground/5">
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Your prompt is...</p>
                  <CardTitle className="text-2xl font-headline tracking-tight">{prompt}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tabular-nums text-primary">{timer}s</span>
                </div>
              </div>
              <Progress value={progress} className="h-3 mt-2" />
            </CardHeader>
            <CardContent className="p-0 aspect-[16/9] bg-white">
              <DoodleCanvas ref={canvasRef} color={color} lineWidth={lineWidth} disabled={gameState !== 'playing'} />
            </CardContent>
            <CardFooter className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-card-foreground/5">
              <div className="flex items-center gap-2 md:col-span-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Palette className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Colors</TooltipContent>
                </Tooltip>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <Tooltip key={c}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={`w-6 h-6 rounded-full border-2 transition-transform duration-150 ${color === c ? 'border-primary scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                                onClick={() => setColor(c)}
                                aria-label={`Select color ${c}`}
                            />
                        </TooltipTrigger>
                        <TooltipContent>{c}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 md:col-span-1 md:justify-center">
                 <Tooltip>
                    <TooltipTrigger asChild><Brush className="text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Line Width</TooltipContent>
                </Tooltip>
                <Slider
                  min={1}
                  max={20}
                  step={1}
                  value={[lineWidth]}
                  onValueChange={(value) => setLineWidth(value[0])}
                  className="w-full max-w-[200px]"
                />
              </div>

              <div className="flex items-center gap-2 md:col-span-1 md:justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => canvasRef.current?.clear()} disabled={gameState !== 'playing'}>
                      <Trash2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear Canvas</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => canvasRef.current?.download(prompt)}>
                      <Download />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleStartGame} size="icon">
                      <RefreshCw />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New Game</TooltipContent>
                </Tooltip>
              </div>
            </CardFooter>
          </Card>
        )}
        <AlertDialog open={isResultOpen} onOpenChange={setIsResultOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {isLoadingAI && <><LoaderCircle className="animate-spin" /> Checking your masterpiece...</>}
                {!isLoadingAI && aiResult && (
                  aiResult.isScribble ? <><XCircle className="text-destructive" /> Needs a bit more work</> : <><CheckCircle className="text-green-500" /> Great Doodle!</>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isLoadingAI ? 'Our AI art critic is examining your work. Please wait a moment.' : aiResult?.feedback}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {!isLoadingAI && (
                <AlertDialogAction onClick={handleStartGame}>Try Again</AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </TooltipProvider>
  );
}
