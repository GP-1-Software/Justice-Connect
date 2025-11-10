import React, { useEffect, useRef } from 'react';

const JitsiMeeting = ({ meetingLink, displayName, onMeetingEnd }) => {
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    // Extract room name from Jitsi link
    const roomName = meetingLink.split('/').pop() || 'justice-connect-meeting';

    // Load Jitsi Meet API
    const script = document.createElement('script');
    script.src = 'https://8x8.vc/external_api.js';
    script.async = true;
    script.onload = () => {
      if (window.JitsiMeetExternalAPI && jitsiContainerRef.current) {
        const options = {
          roomName: roomName,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            enableClosePage: false,
            disableDeepLinking: true,
            defaultLanguage: 'ar'
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'settings', 'raisehand', 'videoquality', 'filmstrip',
              'invite', 'feedback', 'stats', 'shortcuts', 'tileview', 'videobackgroundblur',
              'download', 'help', 'mute-everyone', 'security'
            ],
            SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile'],
            DEFAULT_BACKGROUND: '#1a1a1a',
            INITIAL_TOOLBAR_TIMEOUT: 20000,
            TOOLBAR_TIMEOUT: 4000
          },
          userInfo: {
            displayName: displayName || 'مستخدم'
          }
        };

        apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', options);

        // Event listeners
        apiRef.current.addEventListener('readyToClose', () => {
          if (onMeetingEnd) {
            onMeetingEnd();
          }
        });

        apiRef.current.addEventListener('videoConferenceLeft', () => {
          if (onMeetingEnd) {
            onMeetingEnd();
          }
        });

        apiRef.current.addEventListener('participantLeft', (participant) => {
          console.log('Participant left:', participant);
        });

        apiRef.current.addEventListener('participantJoined', (participant) => {
          console.log('Participant joined:', participant);
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (error) {
          console.error('Error disposing Jitsi API:', error);
        }
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [meetingLink, displayName, onMeetingEnd]);

  return (
    <div className="w-full h-full min-h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      <div ref={jitsiContainerRef} className="w-full h-full" />
    </div>
  );
};

export default JitsiMeeting;

