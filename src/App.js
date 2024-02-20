import './App.css';
import { Route, Routes, useLocation } from "react-router-dom";
import Home from './screens/home/home';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import Cursor from './components/Cursor/cursor';
import StateProvider from './StateProvider';
import Lenis from '@studio-freight/lenis';
import Details from './screens/Portfolio-Details/details';
import AboutMe from './screens/about-me-screen/about';
import axios from 'axios';

// this import is for preventing the notification handler from being called too many times
import { debounce } from 'lodash';

// this imports are for the notification handler
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const baseUrl = process.env.REACT_APP_BASE_URL;
const apiKey = process.env.REACT_APP_API_KEY;

function App() {
  const location = useLocation();
  const lenis = new Lenis();

  lenis.on('scroll', (e) => {
    // console.log(e)
    // maybe set duration and easing
  })

  function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf);
  useEffect(() => {
    window.scroll(0, 0)
  }, [location]);


  const showErrorNotification = debounce((message) => {
    toast.error(message);
  }, 1000);
  const showSuccessNotification = debounce((id, payload) => {
    toast.update(id, payload);
  }, 1000);

  async function getVisitorInfo() {
    try {
      // this is to grab the visitor's IP address to use for the country
      const ipAddressResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipAddressResponse.json();

      // this is to grab visitor's country based on the IP address
      const countryResponse = await fetch(`https://ipapi.co/${ip}/country_name/`);
      const country = await countryResponse.text();

      // this is to grab the visitor's device type and browser from user agent string
      const userAgent = navigator.userAgent;
      const deviceType = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(userAgent) ? 'Mobile' : 'Desktop';
      const browser = (userAgent.match(/(firefox|chrome|safari|opera|msie|trident(?=\/))\/?\s*(\d+)/i) || [])[1] || '';

      return {
        country,
        deviceType,
        browser
      };
    } catch (error) {
      toast.error('An error occurred while retrieving visitor information');
      return null;
    }
  }


  const addUser = async (payload) => {
    const id = toast.loading('Adding user...');
    try {
      const response = await axios.post(
        `${baseUrl}/assessment`,
        payload?.body, {
        headers: {
          "Content-Type": "application/json",
          'x-api-key': apiKey
        },
      }
      );
      showSuccessNotification(id, {
        render: `${response.data.message}`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      })
      return response.data;
    } catch (error) {
      showErrorNotification(error.response.data);
      return error.response.data;
    }
  }
  const debouncedAddUser = debounce((payload) => {
    addUser(payload);
  }, 1000); // to prevent the notification from being called twice

  // Calling the function to get the visitor's information and send it to the server here.
  useEffect(() => {
    getVisitorInfo().then(visitorInfo => {
      debouncedAddUser({
        body: {
          country: visitorInfo.country,
          device_type: visitorInfo.deviceType,
          browser_type: visitorInfo.browser
        }
      });
    });
  }, []);
  return (
    <StateProvider>
      <div id='main-container'>
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Cursor />
        <AnimatePresence
          // initial={false}
          mode='wait'>
          <Routes location={location} key={location.pathname}>
            <Route
              exact
              path="/"
              index
              element={
                <Home />
              }
            />
            <Route
              exact
              path="/batfolio"
              element={
                <Details />
              }
            />
            <Route
              exact
              path="/about_me"
              element={
                <AboutMe />
              }
            />
          </Routes>
        </AnimatePresence>
      </div>
    </StateProvider>
  );
}

export default App;
