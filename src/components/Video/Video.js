import React from 'react'
import { Overlay, VideoContainer } from './Video.element'

function Video() {
    return (
        <>
            <VideoContainer>
                <video
                id='myVideo'
                    loop
                    muted
                    autoPlay
                    >
                    <source src={"config/images/bg.mp4"} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                
            </VideoContainer>

        </>
    )
}

export default Video