// index.js

require('dotenv').config();
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { transcribeAudio } = require('./transcribe');
const { translateSubtitles } = require('./translate');

// Replace this with the path to your local video file
const videoPath = '/Users/brandon-lindberg/projects/video-transcriber/Epic_Duel_of_Crashing_Waves.mp4';

// Function to process local video file
function processLocalVideo(filePath) {
  try {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error('Video file not found at the specified path.');
      return;
    }

    // Use FFmpeg to process the local video file
    ffmpeg(filePath)
      .format('mp3') // Convert to MP3 audio format
      .on('start', function(commandLine) {
        console.log('Spawned FFmpeg with command: ' + commandLine);
      })
      .on('codecData', function(data) {
        console.log('Input is ' + data.audio + ' audio with ' + data.video + ' video');
      })
      .on('progress', function(progress) {
        if (progress.percent) {
          console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
        }
      })
      .on('error', function(err, stdout, stderr) {
        console.log('An error occurred: ' + err.message);
        console.log('FFmpeg stderr: ' + stderr);
      })
      .on('end', function() {
        console.log('Audio extraction finished!');
        // Call the transcription function here
        transcribeAudio('output_audio.mp3').then(transcriptionData => {
          if (transcriptionData) {
            // Proceed with generating SRT files
            generateSRT(transcriptionData);

            // Translate subtitles into multiple languages
            const targetLanguages = ['en', 'ja']; // Add target language codes here
            targetLanguages.forEach(lang => {
              translateSubtitles('subtitles.srt', lang);
            });
          }
        });
      })
      .save('output_audio.mp3'); // Save the output audio file
  } catch (error) {
    console.error('Error processing video file:', error);
  }
}

// Function to generate SRT file from transcription data
function generateSRT(transcriptionData) {
  if (!transcriptionData.segments) {
    console.error('No segments found in transcription data.');
    return;
  }

  const srtEntries = transcriptionData.segments.map((segment, index) => {
    const id = index + 1;
    const startTime = secondsToSRTTime(segment.start);
    const endTime = secondsToSRTTime(segment.end);
    const text = segment.text.trim();

    return `${id}\n${startTime} --> ${endTime}\n${text}\n`;
  });

  const srtContent = srtEntries.join('\n');

  fs.writeFileSync('subtitles.srt', srtContent);
  console.log('SRT file generated: subtitles.srt');
}

// Helper function to convert seconds to SRT time format
function secondsToSRTTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  const milliseconds = ((totalSeconds % 1) * 1000)
    .toFixed(0)
    .padStart(3, '0');

  return `${hours}:${minutes}:${seconds},${milliseconds}`;
}

// Start the process
processLocalVideo(videoPath);
