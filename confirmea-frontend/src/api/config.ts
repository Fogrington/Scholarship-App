// Expo Go on a physical phone can't reach your computer via "localhost" — that
// address refers to the phone itself, not your machine. Set LAN_IP below to your
// computer's actual network IP instead, and make sure your phone and computer are
// on the same Wi-Fi network.
//
// Find your LAN IP:
//   Mac:     ipconfig getifaddr en0        (or en1 if you're on Wi-Fi via a different adapter)
//   Windows: ipconfig                       (look for "IPv4 Address" under your Wi-Fi adapter)
//   Linux:   hostname -I
//
// Exceptions — these work without changing anything below:
//   iOS Simulator     -> can use "localhost" (edit BASE_HOST to "localhost")
//   Android Emulator  -> can use "10.0.2.2" (edit BASE_HOST to "10.0.2.2")
//
// This has to be a real IP, not "localhost", for Expo Go on a real device — that's
// the setup this whole project has been tested with so far.

const LAN_IP = "10.222.126.117"; // <-- CHANGE THIS to your computer's IP address
const BASE_HOST = LAN_IP;
const BASE_PORT = 4000;

export const API_BASE_URL = `http://${BASE_HOST}:${BASE_PORT}`;
