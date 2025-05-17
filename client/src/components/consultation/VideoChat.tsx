import { useState, useEffect, useRef } from "react";
import Peer from "simple-peer";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Video, Mic, MicOff, VideoOff, Phone } from "lucide-react";

interface VideoChatProps {
  consultationId: number;
  userId: number;
  lawyerId: number;
  mode: "video" | "call" | "chat";
}

const VideoChat = ({ consultationId, userId, lawyerId, mode }: VideoChatProps) => {
  const { toast } = useToast();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState<any>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<ReturnType<typeof Peer> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    // Setup WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    socketRef.current = new WebSocket(wsUrl);
    
    socketRef.current.onopen = () => {
      console.log("WebSocket connection established");
      // Join the consultation room
      socketRef.current?.send(JSON.stringify({
        type: "join",
        consultationId,
        userId
      }));
    };
    
    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "videoSignal") {
        if (data.from !== userId) {
          setReceivingCall(true);
          setCaller(data.from);
          setCallerSignal(data.signal);
        }
      }
    };
    
    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Could not connect to the video chat server",
        variant: "destructive"
      });
    };
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [consultationId, userId, toast]);
  
  const startCall = async () => {
    try {
      // Get user media
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: mode === "video", 
        audio: true 
      });
      
      setStream(mediaStream);
      
      if (myVideo.current) {
        myVideo.current.srcObject = mediaStream;
      }
      
      // Create new peer connection
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: mediaStream
      });
      
      // When connection is established
      peer.on("signal", (signal: any) => {
        socketRef.current?.send(JSON.stringify({
          type: "videoSignal",
          to: lawyerId,
          from: userId,
          signal
        }));
      });
      
      // When receiving stream from other user
      peer.on("stream", (remoteStream: MediaStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
        }
      });
      
      // Set the connection reference
      connectionRef.current = peer;
      
      toast({
        description: "Initiating call... Please wait for the other party to join.",
      });
      
    } catch (error) {
      console.error("Failed to get media devices:", error);
      toast({
        title: "Media Error",
        description: "Unable to access camera or microphone. Please check your permissions.",
        variant: "destructive"
      });
    }
  };
  
  const answerCall = () => {
    setCallAccepted(true);
    
    navigator.mediaDevices.getUserMedia({ 
      video: mode === "video", 
      audio: true 
    }).then((mediaStream) => {
      setStream(mediaStream);
      
      if (myVideo.current) {
        myVideo.current.srcObject = mediaStream;
      }
      
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: mediaStream
      });
      
      // Accept the incoming signal
      peer.on("signal", (signal: any) => {
        socketRef.current?.send(JSON.stringify({
          type: "videoSignal",
          to: caller,
          from: userId,
          signal
        }));
      });
      
      // When receiving stream from other user
      peer.on("stream", (remoteStream: MediaStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
        }
      });
      
      // Signal the peer with the caller's signal
      peer.signal(callerSignal);
      
      // Set the connection reference
      connectionRef.current = peer;
    });
  };
  
  const endCall = () => {
    setCallEnded(true);
    
    // Close the peer connection
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    
    // Stop all media tracks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    toast({
      description: "Call ended.",
    });
  };
  
  const toggleMute = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  const toggleVideo = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  
  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        {/* My video */}
        <div className="relative w-full md:w-1/3 h-48 bg-gray-900 rounded-lg overflow-hidden">
          <video
            playsInline
            muted
            ref={myVideo}
            autoPlay
            className={`w-full h-full object-cover ${isVideoOff && mode === "video" ? "hidden" : ""}`}
          />
          {(isVideoOff && mode === "video") && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
              <p>Camera Off</p>
            </div>
          )}
          {mode === "call" && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
              <p>You (Audio Only)</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            You
          </div>
        </div>
        
        {/* Remote video */}
        <div className="relative w-full md:w-1/2 h-72 bg-gray-900 rounded-lg overflow-hidden">
          <video
            playsInline
            ref={userVideo}
            autoPlay
            className="w-full h-full object-cover"
          />
          {!callAccepted && !callEnded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
              <p>Waiting for the other participant...</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            Other Participant
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-2 mt-4">
        {/* Call controls */}
        {!callAccepted && !callEnded && !receivingCall && (
          <Button onClick={startCall} className="bg-green-600 hover:bg-green-700">
            <Phone className="mr-2 h-4 w-4" />
            Start Call
          </Button>
        )}
        
        {receivingCall && !callAccepted && (
          <Button onClick={answerCall} className="bg-green-600 hover:bg-green-700">
            <Phone className="mr-2 h-4 w-4" />
            Answer Call
          </Button>
        )}
        
        {callAccepted && !callEnded && (
          <>
            <Button onClick={toggleMute} variant="outline" className={isMuted ? "bg-red-100" : ""}>
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            
            {mode === "video" && (
              <Button onClick={toggleVideo} variant="outline" className={isVideoOff ? "bg-red-100" : ""}>
                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
            )}
            
            <Button onClick={endCall} className="bg-red-600 hover:bg-red-700">
              End Call
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoChat;