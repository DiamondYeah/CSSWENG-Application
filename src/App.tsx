import './App.css'
import LandingPage from "./pages/LandingPage";
import Navbar from "./components/Navbar";
import Scheduling from "./pages/Scheduling";
import PrivacySection from './pages/PrivacySection';
import TermsOfService from './pages/TermsOfService';
import NotFoundPage from './pages/NotFound';
import Calendar from './pages/Calendar';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { StrictMode } from 'react';
const router = createBrowserRouter([
  {path: "/", element: <LandingPage />},
  {path:"/dashboard", element:<Scheduling></Scheduling>},
  {path:"/privacy", element:<PrivacySection/>},
  {path:"/terms", element:<TermsOfService/>},
  {path:"/calendar", element:<Calendar/>},
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

