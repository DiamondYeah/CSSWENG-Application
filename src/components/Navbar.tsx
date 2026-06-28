import "./Navbar.css";
import { VscAccount } from "react-icons/vsc";
import { AiOutlineSchedule } from "react-icons/ai";
import { MdOutlineAnalytics } from "react-icons/md";
import { IoMailOutline } from "react-icons/io5";
import { CiSettings } from "react-icons/ci";
import { FaRegEdit } from "react-icons/fa";

// npm install react-icons for navbar icons
// settings icon was placed for design and as reference to the original OneUp

function Navbar() {
  return (
    <nav className ="navbar">
        <a href="#" className="nav-name">AgilaPost</a>
        
        <h2>Overview</h2>
        <ul>
            <li><a href="#"><VscAccount /> Accounts</a></li>
            <li><a href="#"><AiOutlineSchedule /> Scheduling</a></li>
            <li><a href="#"><MdOutlineAnalytics /> Analytics</a></li>
            <li><a href="#"><IoMailOutline /> Social Inbox</a></li>
        </ul>

         <button type="button" className="navPostButton" onClick={() => ("/create-post")}><FaRegEdit size={20} /><a href="create-post">Create Post </a></button>
    
        <div className="settings-icon"> 
          <CiSettings />
        </div>
    </nav>
  );
}

export default Navbar;