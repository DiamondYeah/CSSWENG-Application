import './App.css'
import LandingPage from "./pages/LandingPage";
import Scheduling from "./pages/Scheduling";
import PrivacySection from './pages/PrivacySection';
import TermsOfService from './pages/TermsOfService';
import NotFoundPage from './pages/NotFound';
import CreatePost from './pages/CreatePost';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Calendar from './pages/Calendar';
import Accounts from './pages/Accounts'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { StrictMode } from 'react';
const router = createBrowserRouter([
  {path: "/", element: <LandingPage />},
  {path:"/dashboard", element:<Scheduling></Scheduling>},
   { path: "/signin", element: <SignIn /> },
  { path: "/signup", element: <SignUp /> },
  { path: "/create-post", element: <CreatePost /> },
  {path:"/privacy", element:<PrivacySection/>},
  {path:"/terms", element:<TermsOfService/>},
  {path:"/calendar", element:<Calendar/>},
  {path:"/accounts", element:<Accounts/>},
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

