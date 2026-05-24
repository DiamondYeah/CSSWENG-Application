import { useNavigate } from "react-router";
async function authenticate() {
      alert("Test")
      window.location.href = 'http://localhost:5000/oauth';
      console.log("EWSS")
}

function Test() {
    const nav = useNavigate() 
    const navigate = ()=>{
        nav('/userInfo')
    }
    return(
    <div>
        <h1>Hello World!</h1>
        <button onClick={navigate}>userInfo</button>
        <button onClick={authenticate}>Press me</button>
    </div>
    );
}

export default Test
