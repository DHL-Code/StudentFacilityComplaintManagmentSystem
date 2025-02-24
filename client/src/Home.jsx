import React from 'react';
import './Home.css'
const Home = () => {
  return (
    <>
      
        <h1 >Home Page</h1>
        
      
      
      <section style={styles.section} className='welcome'>
        <p style={styles.paragraph}>Welcome to the Wolkite University Student Facility Complaint Management System.
           <br /> This platform streamlines facility issue reporting and ensures quick resolutions <br />
         Together, we create a better campus experience for all.</p>
      </section>
      
      <section style={styles.section}>
        <p>This is the contact section</p>
        
      </section>
    </>
  );
};

const styles = {
  section: {
    height: '100vh',  // Full screen height
    width: '100%',     // Full width
    display: 'flex',   // Make it a flex container
    justifyContent: 'center',  // Center horizontally
    marginTop:'50px',
   
  },
  paragraph:{
    fontFamily: "Times New Roman",
    fontSize:'26px'
    },
  center:{
alignItems:'center',
justifyContent:'center',
    }
};

export default Home;
