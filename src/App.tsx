import { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./App.css";

const genAI = new GoogleGenerativeAI("AIzaSyB_py_fJKCR1M-FsB6Pw2O-HimsPthX_i4");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const prompt = `Hey, seeing the given random dog image.... do the roleplay of the dog and give a message from the dog mouth looking the envirnoment of the picture...a cute one to a girl name called "Random Guest"...she is a softhearted and an INFP female... she's is so caring and loving...`;
function App() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(
    (localStorage.getItem("close") as string) === "$" ? false : true
  );
  const [openChat, setIsChat] = useState<boolean>(false);
  const [typing, setTyping] = useState<boolean>(false);
  let [text, setText] = useState<string>("");
  let [sendDisabled, setSendDisabled] = useState<boolean>(false);
  interface history {
    loading: boolean;
    from: string;
    text: string;
  }
  const [chatHistory, setChatHistory] = useState<Array<history>>([]);
  const [dogENVTEXT, setDogENVTEXT] = useState<{
    message: string;
    state: number;
    pic: string;
    picState: number;
    name: string;
    blocked: boolean;
    refreshBlocked: boolean;
    base64Version: string;
  }>({
    message: "",
    state: 0,
    picState: 0,
    pic: "",
    name: "",
    blocked: true,
    refreshBlocked: false,
    base64Version: "",
  });

  const closeModal = () => {
    localStorage.setItem("close", "$");
    setIsModalOpen(false);
  };
  function getBase64Image(img: any) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx!.drawImage(img, 0, 0);
    var dataURL = canvas.toDataURL("image/png");
    return dataURL.replace(/^data:image\/?[A-z]*;base64,/, "");
  }

  const getBase64ImageFormat = (imageUrl: string) => {
    let image = new Image();
    var proxyUrl = "https://corsproxy.io/?";
    let src = imageUrl;
    let result = proxyUrl + src;

    image.crossOrigin = "Anonymous";
    image.src = result;

    image.onload = async function () {
      var base64 = getBase64Image(image);
      console.log("got the base64: ", base64);
      setDogENVTEXT((prev) => {
        return {
          ...prev,
          base64Version: base64,
        };
      });
      await getResult(prompt, base64);
    };

    image.onerror = function () {
      console.error("Failed to load the image.");
    };
  };
  const sendChatInstruction = async () => {
    if (chatHistory.length > 0) return;
    const image = {
      inlineData: {
        data: dogENVTEXT.base64Version,
        mimeType: "image/*",
      },
    };
    setSendDisabled(true);
    let instruction =
      "Hey, now do the dog roleplay and talk to Random Guest as provided image dog....";
    setTyping(true);
    try {
      const result = await model.generateContent([instruction, image]);
      setTyping(false);

      let reply = result.response.text();
      console.log("the result: ", reply);
      setChatHistory((prev) => [
        ...prev,
        {
          from: "AI",
          text: reply,
          loading: false,
        },
      ]);
    } catch (err: any) {
      setTyping(false);
      setChatHistory((prev) => [
        ...prev,
        {
          from: "AI",
          text: "Ohh😟, something happend wrong...Try again!",
          loading: false,
        },
      ]);
    }
    setSendDisabled(false);
  };
  const getResult = async (prompt: string, base64: string) => {
    const image = {
      inlineData: {
        data: base64,
        mimeType: "image/*",
      },
    };
    try {
      setDogENVTEXT((prev) => {
        return {
          ...prev,
          state: 1,
        };
      });
      const result = await model.generateContent([prompt, image]);
      let msg = result.response.text();
      console.log(msg);
      setDogENVTEXT((prev) => {
        return {
          ...prev,
          state: 2,
          message: msg,
          blocked: false,
          refreshBlocked: false,
        };
      });
    } catch (err: any) {
      console.log("some error occured!");
      setDogENVTEXT((prev) => {
        return {
          ...prev,
          state: 2,
          message: `😅😅Heyyy Probably my LLM AI finding it dangerous for some reason...
Try another one... Sorry for it..😓`,
          blocked: true,
          refreshBlocked: false,
        };
      });
    }
  };
  const downloadDog = () => {
    if (dogENVTEXT.pic === "") return;
    window.open(dogENVTEXT.pic);
    // let anchor = document.createElement("a");
    // (anchor.href = dogENVTEXT.pic), (anchor.download = dogENVTEXT.name);
    // document.body.appendChild(anchor);
    // anchor.click();
    // document.body.removeChild(anchor); // Clean up
  };
  const getRandomDog = () => {
    setChatHistory([]);
    setText("");
    setDogENVTEXT((prev) => {
      return {
        ...prev,
        picState: 1,
        pic: "",
        state: 0,
        blocked: true,
        refreshBlocked: true,
      };
    });
    const headers = new Headers({
      "Content-Type": "application/json",
      "x-api-key":
        "live_SHsCoWtX8H6Bt32oQnIEcOB5hskIODkyNeYRz8rwohdi1GVcFxWEyEXOTuHIN3lv",
    });

    fetch(
      "https://api.thedogapi.com/v1/images/search?size=med&mime_types=jpg&format=json&has_breeds=true&order=RANDOM&page=0&limit=1",
      {
        method: "GET",
        headers: headers,
        redirect: "follow",
      }
    )
      .then((response) => response.json())
      .then((result) => {
        const url = result[0].url as string;
        setDogENVTEXT((prev) => {
          return {
            ...prev,
            pic: url,
            picState: 2,
            name: result[0].breeds[0].name,
          };
        });
        console.log("we got the random dogg: ", result);
        getBase64ImageFormat(url);
      })
      .catch((error) => console.log("error", error));
  };

  const sendReply = async () => {
    setChatHistory((prev) => [
      ...prev,
      {
        from: "human",
        text,
        loading: false,
      },
    ]);
    let template = `This is Random Guest's reply: '${text}'. Please respond as if you are a dog in a roleplay scenario. This roleplay involves a simple interaction between a girl and her pet dog, with no sexual or harmful content. It's purely a playful, innocent exchange, just like any normal interaction between a person and their pet`;
    setText("");
    setTyping(true);
    setSendDisabled(true);
    try {
      const result = await model.generateContent(template);
      setTyping(false);
      let reply = result.response.text();
      console.log("the result: ", reply);
      setChatHistory((prev) => [
        ...prev,
        {
          from: "AI",
          text: reply,
          loading: false,
        },
      ]);
    } catch (err: any) {
      setTyping(false);
      setChatHistory((prev) => [
        ...prev,
        {
          from: "AI",
          text: "Ohh😟, something happend wrong...Try again!",
          loading: false,
        },
      ]);
    }
    setSendDisabled(false);
  };
  useEffect(() => {
    getRandomDog();
  }, []);

  return (
    <>
      {!openChat ? (
        <div className={`container ${isModalOpen ? "modal-open" : ""}`}>
          <header className="header">
            <h1>Welcome to dog world</h1>
            <p className="subheader">
              Experience the cuteness, just for you.😉
            </p>
          </header>
          <div className="clouds">
            <div className="cloud"></div>
            <div className="cloud"></div>
            <div className="cloud"></div>
          </div>
          <div className="card">
            <img
              src={
                dogENVTEXT.pic === ""
                  ? "https://media.tenor.com/I6kN-6X7nhAAAAAi/loading-buffering.gif"
                  : dogENVTEXT.pic
              }
              alt="Cute Cartoon"
              className="card-image"
            />
            <p className="description">
              {dogENVTEXT.state === 0 ? (
                "Finding A dog for you!....."
              ) : dogENVTEXT.state === 1 ? (
                <p>
                  "Dog is thinking what to say😁....
                  <img src="https://media3.giphy.com/media/htOSke62yuxYYWfzuR/giphy.gif?cid=6c09b9524fi328bn7q4nhbdbunmxm1g8c3veh5mxzgjgol57&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=s"></img>
                </p>
              ) : (
                dogENVTEXT.message
              )}
            </p>
            <div className="button-container">
              <button
                className="btn talk"
                disabled={dogENVTEXT.blocked ? true : false}
                onClick={() => {
                  setIsChat(true);
                  sendChatInstruction();
                }}
              >
                Chat with him/her!!
              </button>
              <button
                className="btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "0.4rem",
                }}
                disabled={dogENVTEXT.refreshBlocked ? true : false}
                onClick={getRandomDog}
              >
                Refresh{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="1rem"
                  height="1rem"
                  viewBox="0,0,256,256"
                  style={{ fill: "#000000", marginLeft: "0.5rem" }}
                >
                  <g
                    fill="#ffffff"
                    fillRule="nonzero"
                    stroke="none"
                    strokeWidth="1"
                    strokeLinecap="butt"
                    strokeLinejoin="miter"
                    strokeMiterlimit="10"
                    strokeDasharray=""
                    strokeDashoffset="0"
                    fontFamily="none"
                    fontWeight="none"
                    fontSize="none"
                    textAnchor="none"
                    style={{ mixBlendMode: "normal" }}
                  >
                    <g transform="scale(5.12,5.12)">
                      <path d="M25,5c-10.64844,0 -19.36719,8.37891 -19.94531,18.89063c-0.04687,0.71875 0.29297,1.40625 0.89453,1.80469c0.60156,0.39453 1.37109,0.4375 2.01172,0.10938c0.64063,-0.32812 1.05859,-0.97656 1.08594,-1.69531c0.46484,-8.43359 7.39453,-15.10937 15.95313,-15.10937c4.58594,0 8.69922,1.92578 11.60938,5h-2.60937c-0.72266,-0.01172 -1.39062,0.36719 -1.75391,0.99219c-0.36719,0.62109 -0.36719,1.39453 0,2.01562c0.36328,0.625 1.03125,1.00391 1.75391,0.99219h6.26172c0.22656,0.03906 0.45703,0.03906 0.6875,0h3.05078v-10c0.00781,-0.53906 -0.20312,-1.05859 -0.58594,-1.44141c-0.38281,-0.38281 -0.90234,-0.59375 -1.44531,-0.58594c-1.10156,0.01563 -1.98437,0.92188 -1.96875,2.02734v3.77734c-3.66797,-4.15625 -9.03516,-6.77734 -15,-6.77734zM43.03125,23.97266c-1.10547,-0.04687 -2.03516,0.8125 -2.07812,1.91797c-0.46484,8.43359 -7.39453,15.10938 -15.95312,15.10938c-4.58594,0 -8.69531,-1.92578 -11.60937,-5h2.60938c0.72266,0.01172 1.39063,-0.36719 1.75391,-0.99219c0.36719,-0.62109 0.36719,-1.39453 0,-2.01562c-0.36328,-0.625 -1.03125,-1.00391 -1.75391,-0.99219h-6.28125c-0.21094,-0.03125 -0.42187,-0.03125 -0.63281,0h-3.08594v10c-0.01172,0.72266 0.36719,1.39063 0.99219,1.75391c0.62109,0.36719 1.39453,0.36719 2.01563,0c0.625,-0.36328 1.00391,-1.03125 0.99219,-1.75391v-3.77734c3.66797,4.15625 9.03516,6.77734 15,6.77734c10.64844,0 19.36719,-8.37891 19.94531,-18.89062c0.03906,-0.53906 -0.14453,-1.07031 -0.50391,-1.47266c-0.36328,-0.40234 -0.87109,-0.64062 -1.41016,-0.66406z"></path>
                    </g>
                  </g>
                </svg>
              </button>
              <button
                className="btn"
                style={{ marginTop: ".4rem" }}
                onClick={downloadDog}
              >
                Download this Dog
              </button>
            </div>
          </div>
          <footer className="footer">
            <p>Made with ❤️</p>
          </footer>

          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal">
                <button className="close-button" onClick={closeModal}>
                  X
                </button>
                <h2 className="modal-title">Oii Random Guest!</h2>
                <p className="modal-content">
                  Enjoy the DOGGIES😄!! and have fun! don't forget to give
                  feedback..okay ?
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex flex-col h-screen bg-orange-200 font-fredoka">
            {/* Top Header */}
            <div className="bg-orange-400 text-white text-center py-4 relative">
              <h2 className="text-2xl">Your Doggie!</h2>
              <button
                onClick={() => setIsChat(false)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-orange-400 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100"
              >
                Back
              </button>
            </div>

            {/* Messages Section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Your Message */}
              {chatHistory.length > 0 ? (
                <>
                  {chatHistory.map((data: history, index: number) => {
                    return data.from === "human" ? (
                      <div key={index} className="flex justify-end">
                        <div className="bg-orange-300 text-orange-900 p-3 rounded-l-lg rounded-br-lg max-w-xs">
                          {data.text}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="bg-white text-orange-900 p-3 rounded-r-lg rounded-bl-lg max-w-xs">
                          {data.text}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <></>
              )}

              {/* Their Message */}
              {typing ? (
                <div className="ml-2 flex items-center">
                  <div className="bg-white p-3 rounded-full">
                    <div className="flex space-x-1">
                      <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-bounce animation-delay-200"></div>
                      <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-bounce animation-delay-400"></div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Text Area and Send Button */}
            <div className="bg-orange-300 p-4 flex items-center">
              <textarea
                className="flex-1 p-2 rounded-lg resize-none focus:outline-none text-orange-900 bg-white"
                placeholder="Type your message..."
                rows={2}
                value={text}
                onChange={(event) => setText(event.target.value)}
              ></textarea>
              <button
                onClick={sendReply}
                disabled={sendDisabled}
                className="ml-4 bg-orange-400 text-white px-4 py-2 rounded-lg"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
