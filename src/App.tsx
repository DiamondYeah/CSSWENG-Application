import './App.css'
import LandingPage from "./pages/LandingPage";
import PrivacySection from './pages/PrivacySection';
import TermsOfService from './pages/TermsOfService';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import NotFoundPage from './pages/NotFound';
import CreatePost from './pages/CreatePost';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Calendar from './pages/Calendar';
import SharedCalendar from './pages/SharedCalendar'
import Accounts from './pages/Accounts';
import Category from './pages/Category';
import Queue from './pages/Queue';
import TimeslotsPage from './pages/TimeslotsPage';

// Import logged in wrapper to wrap around pages that need an account logged in.
import LoggedInWrapper from "./components/loggedInWrapper";

import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { StrictMode } from 'react';


const router = createBrowserRouter([
  {path: "/", element: <LandingPage />},

  { path: "/signin", element: <SignIn />},
  { path: "/signup", element: <SignUp />},
  {path: "/privacy", element: <PrivacySection/>},
  {path: "/terms", element: <TermsOfService/>},
  {path: "/pricing", element: <Pricing/>},
  {path: "/faq", element: <FAQ/>},
  {path: "/calendar/share/:token", element: <SharedCalendar/>}, // ADDED for working share calendar


  {path: "/category", element: <LoggedInWrapper><Category/></LoggedInWrapper>},
  {path: "/accounts", element: <LoggedInWrapper><Accounts/></LoggedInWrapper>},
  {path: "/create-post", element: <LoggedInWrapper><CreatePost /></LoggedInWrapper>},
  {path: "/calendar", element: <LoggedInWrapper><Calendar/></LoggedInWrapper>}, // CHANGED: pass sample props
  {path: "/dashboard", element: <LoggedInWrapper><Navigate to="/calendar" replace /></LoggedInWrapper>}, // Dashboard discarded — Calendar is now the default landing view after sign-in
  {path: "/queue", element: <LoggedInWrapper><Queue /></LoggedInWrapper> },
  {path: "/timeslots", element: <LoggedInWrapper><TimeslotsPage /></LoggedInWrapper>},

  {path:"*", element:<NotFoundPage/>}
])
//Routing 
function App() {
  return (
    <StrictMode>
     
            <RouterProvider router = {router}/>
  
    
      
    </StrictMode>
    
  );
}

export default App;