import React from "react";
import { Button } from "@/components/ui/button";
  import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mode } from '@/helpers/constants';

interface DictaphoneButtonsProps {
  selectedMode: Mode,
}

const RecordButtons: React.FC<DictaphoneButtonsProps> = ({ selectedMode }) => {
  const { listening } = useSpeechRecognition();

  const startListening = () => {
    SpeechRecognition.startListening({ continuous: true });
  };
  const handleHoldStart = () => {
    startListening();
  };

  const handleHoldEnd = () => {
    SpeechRecognition.stopListening();
  };

  const handleAutoClick = () => {
    if (!listening) {
      SpeechRecognition.startListening();
    } else {
      SpeechRecognition.stopListening();
    }
  };

  const handleManualClick = () => {
    if (!listening) {
      startListening();
    } else {
      SpeechRecognition.stopListening();
    }
  };
  

  return (
    <>
      {selectedMode.value === 'hold' && (
        <Button
          onTouchStart={handleHoldStart}
          onMouseDown={handleHoldStart}
          onTouchEnd={handleHoldEnd}
          onMouseUp={handleHoldEnd}
        >
           {listening ? 'Listening...' : 'Hold-to-talk'}
        </Button>
      )}
      {selectedMode.value === 'auto' && (
        <Button
          color='danger'
          onClick={handleAutoClick}
        >
          {listening ? 'Listening...' : 'Start Recording'}
        </Button>
      )}
      {selectedMode.value === 'manual' && (
        <Button
          color='danger'
          onClick={handleManualClick}
        >
          {listening ? 'Stop Recording' : 'Start Recording'}
        </Button>
      )}
    </>
  );
};

export default RecordButtons;