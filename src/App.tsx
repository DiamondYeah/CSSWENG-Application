import { BrowserRouter, Routes, Route } from "react-router";
import './App.css'
import Test from './Test'
import UserInfo from "./userInfo";
function App() {
  return (
    

  <BrowserRouter>
  <Routes>
    <Route path='/userInfo' element={<UserInfo/>}></Route>
    <Route path='/Test' element={<Test/>}></Route>
  </Routes>
  </BrowserRouter>
  );
}

export default App
