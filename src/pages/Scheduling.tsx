import "./Scheduling.css";
import { FaRegLightbulb } from "react-icons/fa";
import { PiPencilSimpleLine } from "react-icons/pi";
import { LuClock } from "react-icons/lu";
import { LuCircleCheckBig } from "react-icons/lu";
import { IoCloudUploadOutline } from "react-icons/io5";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { IoPersonOutline } from "react-icons/io5";
import { IoArrowForward } from "react-icons/io5";
import { FaPlus } from "react-icons/fa";
import { MdOutlineFileUpload } from "react-icons/md";
import emptyPfp from "../assets/emptyPfp.jpg";
import Navbar from "../components/Navbar";
function Scheduling() {
  return (
      
      <div>
      <Navbar/>
        <main className="main-content">
               <div className="scheduling-page">
                
        

      <div className="scheduling-tabs">
        <div className="tab">Queue</div>
        <div className="tab"><a href="/calendar">Calendar</a></div>
        <div className="tab">Category</div>
        <div className="tab">Timeslots</div>
      </div>

      <div className="stats-layout">
        <div className="stat-card stat-ideas">
          <div className="ideas-icon"><FaRegLightbulb size={30}/></div>
          
          <div>
            <span>Ideas</span>
            <h2>0</h2>
          </div>
        </div>

        <div className="stat-card stat-drafts">
          <div className="drafts-icon"><PiPencilSimpleLine size={30}/></div>
          
          <div>
            <span>Drafts</span>
            <h2>0</h2>
          </div>
        </div>

        <div className="stat-card stat-scheduled">
          <div className="scheduled-icon"><LuClock size={30}/></div>
          
          <div>
            <span>Scheduled</span>
            <h2>0</h2>
          </div>
        </div>

        <div className="stat-card stat-published">
          <div className="published-icon"><LuCircleCheckBig size={30}/></div>
          
          <div>
            <span>Published</span>
            <h2>0</h2>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">

        <div className="left-panel">

          <div className="search-area">
            <div className="search-input-wrapper">
              <HiMagnifyingGlass className="search-icon" />
              <input type="text" placeholder="Search posts..." className="search-input"/>
            </div>

            <div className="filter-wrapper">
              <IoPersonOutline className="filter-icon" />
              <select className="account-filter">
                <option value="">Filter by account</option>
                <option value="">Account 1</option>
                <option value="">Account 2</option>
              </select>
            </div>
          </div>

          <div className="empty-posts">
            <div className="img-placeholder">

            </div>

            <div className="empty-title">
              No scheduled posts
            </div>

            <div className="empty-info">
              Plan your content ahead and keep your social media active automatically
            </div>

            <div className="empty-buttons">
              <div className="left-post-btn">
                <FaPlus className="middle-post-btn" size={12}/>
                Create a post
              </div>

              <div className="left-bulk-btn">
                <MdOutlineFileUpload className="middle-bulk-btn" size={15}/>
                Bulk Upload
              </div>
            </div>
          </div>
        </div>  

        <div className="right-panel">

            <div className="card">
              <div className="card-title">Quick Actions</div>

              <div className="card-list">

                <div className="feature">
                  <div className="feature-container">
                    <div className="feature-post-icon"><PiPencilSimpleLine size={25} /></div>

                    <div className="feature-wrapper">
                      <div className="feature-title">Create a post</div>
                      <p>Design and schedule a new post</p>
                    </div>
                  </div>
                  
                  <button className="arrow"><IoArrowForward size={15}/></button>
                </div>

                <div className="feature">
                  <div className="feature-container">
                    <div className="feature-upload-icon"><IoCloudUploadOutline size={25}/></div>

                    <div className="feature-wrapper">
                      <div className="feature-title">Bulk upload</div>
                      <p>Upload multiple posts at once</p>
                    </div>
                  </div>

                  <button className="arrow"><IoArrowForward size={15}/></button>
        
                </div>
                
                <div className="feature">
                  <div className="feature-container">
                    <div className="feature-search-icon"><HiMagnifyingGlass size={25}/></div>

                    <div className="feature-wrapper">
                      <div className="feature-title">Search posts</div>
                      <p>Find and manage your posts</p>
                    </div>
                  </div>

                  <button className="arrow"><IoArrowForward size={15}/></button>
                </div>

                <div className="feature">
                  <div className="feature-container">
                    <div className="feature-filter-icon"><IoPersonOutline size={25}/></div>

                    <div className="feature-wrapper">
                      <div className="feature-title">Fitler by account</div>
                      <p>View posts by specific account</p>
                    </div>
                  </div>
                  
                  <button className="arrow"><IoArrowForward size={15} /></button>
                </div>
              </div>

            </div>

            <div className="card">
              <div className="card-header">
                <div className="recent-accounts">Recent Accounts</div>
                <div className="view-all"><a href="#">View all</a></div>
              </div>

              <div className="account-item">
                <img src={emptyPfp} className="account-img"/>
                
                <div className="account-details">
                  <div className="account-name">AgilaPost Official</div>
                  <div className="account-username">@agilapost</div>
                </div>
              </div>

              <div className="account-item">
                <img src={emptyPfp} className="account-img"/>

                <div className="account-details">
                  <div className="account-name">Account 2</div>
                  <div className="account-username">@accountTwo</div>
                </div>
              </div>

              <div className="account-item">
                <img src={emptyPfp} className="account-img"/>

                <div className="account-details">
                  <div className="account-name">Account 3</div>
                  <div className="account-username">@accountThree</div>
                </div>
              </div>
            </div>

          </div>    

      </div>

    </div>
          </main>
        </div>  
   
        
        

  );
}

export default Scheduling;