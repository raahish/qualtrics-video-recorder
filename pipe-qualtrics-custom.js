var isRecording = false;
var detections_array = [];
var face_threshold = 0.4;
var transcript_threshold = 0.3;
//var global_transcript = "";

const loadPipe = async function(question_name, pipeParams, deepGramConfiguration) {
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://s3.amazonaws.com/com.knit.dev/templates/dist/');

    // var qobj = this;
    //qobj.hideNextButton();
    //objectValue["streamTime"]='1.0'
    PipeSDK.insert(question_name, pipeParams, function(recorderObject) {

        recorderObject.onReadyToRecord = async function(recorderId, recorderType) {
            var args = Array.prototype.slice.call(arguments);
            //console.log("onReadyToRecord("+args.join(', ')+")");
            // try to access users webcam and stream the images
            // to the video element
            const videoEl = document.getElementById('pipeVideoInput-'+question_name);
            videoEl.setAttribute("onplay", "onPlay(this)");
        };
        recorderObject.btRecordPressed = function(recorderId) {
            var args = Array.prototype.slice.call(arguments);
            //console.log("btRecordPressed("+args.join(', ')+")");
            isRecording = true;
            detections_array = [];
            global_transcript = "";
            navigator.getUserMedia({
                    audio: true,
                    video: {}
                },
                stream => videoEl.srcObject = stream,
                err => console.error(err)
            );
            const videoEl = document.getElementById('pipeVideoInput-'+question_name);
            //console.log("videoEl.srcObject",videoEl);
            const mediaRecorder = new MediaRecorder(videoEl.srcObject, {
                mimeType: 'audio/webm',
            });
            let socket = new WebSocket('wss://api.deepgram.com/v1/listen', [
                'token',
                '2b0d154cf9bee4a3c9431afb651625a05ba11739',
            ]);

            //deepGramConfiguration
            // let socket = new WebSocket(deepGramConfiguration.endPoint, [
            //   'token',
            //   deepGramConfiguration.token,
            // ]);
            socket.onopen = () => {
                //console.log({ event: 'onopen' })
                mediaRecorder.addEventListener('dataavailable', async (event) => {
                    if (event.data.size > 0 && socket.readyState == 1) {
                        socket.send(event.data)
                    }
                })
                mediaRecorder.start(250)
            }

            socket.onmessage = (message) => {
                const received = JSON.parse(message.data)
                //console.log("Received ",received);
                const transcript = received.channel.alternatives[0].transcript
                if (transcript && received.is_final) {
                    console.log(">>>", transcript)
                    global_transcript +=
                        transcript + ' '
                }
            }
            socket.onerror = (error) => {
                console.log({
                    event: 'onerror',
                    error
                })
            }
            socket.onclose = () => {
                console.log({
                    event: 'onclose'
                })
            }
        };
        recorderObject.btStopRecordingPressed = function(recorderId) {
            // console.log("objectValue",objectValue);
            var args = Array.prototype.slice.call(arguments);
            console.log("btStopRecordingPressed(" + args.join(', ') + ")");
            isRecording = false;
            //console.log(detections_array);
            // validateVideo();
            //socket.close();
            const detections_list = detections_array;
            const countDefined = (arr = []) => {
                let filtered;
                filtered = arr.filter(el => {
                    return el !== undefined;
                });
                const {
                    length
                } = filtered;
                return length;
            };
            const transcript_array = global_transcript.split(" ");
            console.log("location", location);
            validateVideo(recorderObject, detections_list, detections_array, transcript_array);

            // console.log("countDefined(detections_list)/detections_array.length < face_threshold");
            // console.log("countDefined(detections_list)",countDefined(detections_list));
            // console.log("detections_array.length",detections_array.length);
            // console.log("face_threshold",face_threshold);
            // console.log("face_threshold",countDefined(detections_list)/detections_array.length);
            // console.log("============");
            // console.log("recorderObject.getStreamTime()",recorderObject.getStreamTime());
            // console.log("============");
            // console.log("transcript_array.length()/recorderObject.getStreamTime()",transcript_array.length/recorderObject.getStreamTime());
            // console.log("transcript_array.length()",transcript_array.length);

            // console.log("recorderObject.getStreamTime()",recorderObject.getStreamTime());
            // console.log("transcript_threshold",transcript_threshold);


            // if(recorderObject.getStreamTime() < 10){
            //     alert("Please record an atleast 10 second long video.");
            // }
            // else if(countDefined(detections_list)/detections_array.length < face_threshold){
            //     alert("We couldn't see your face in the video.");
            // }
            // else if(transcript_array.length/recorderObject.getStreamTime() < transcript_threshold){
            //     alert("You aren't talking or you are not audible.");
            // }
            // else {
            //    // Qualtrics.SurveyEngine.setEmbeddedData("Q1_pipe_url", "https://" + location + "/fb6878ab6bdc0a6bc55c2a6b3f695e05/" + streamName + ".mp4");
            //     //qobj.showNextButton();
            //     console.log("Video is Eigible");
            // }
        };

        recorderObject.onSaveOk = function(
            recorderId,
            streamName,
            streamDuration,
            cameraName,
            micName,
            audioCodec,
            videoCodec,
            fileType,
            videoId,
            audioOnly,
            location
        ) {
            //onVideoUploadSuccess is part of the native mobile recorder's JS events API (upload new or existing recording)
            //var args = Array.prototype.slice.call(arguments);
            //console.log("onVideoUploadSuccess(" + args.join(", ") + ")");
            console.log("setEmbeddedDataToQuestion >>>>>> >>>>> >>>>onSaveOk");
            setEmbeddedDataToQuestion(location, streamName);

        };

        recorderObject.onVideoUploadSuccess = function(
            recorderId,
            filename,
            filetype,
            videoId,
            audioOnly,
            location
        ) {
            //onVideoUploadSuccess is part of the native mobile recorder's JS events API (upload new or existing recording)
            //var args = Array.prototype.slice.call(arguments);
            //console.log("onVideoUploadSuccess(" + args.join(", ") + ")");
            console.log("setEmbeddedDataToQuestion >>>>>> >>>>> >>>>onVideoUploadSuccess");
            setEmbeddedDataToQuestion(location, streamName);

        };
    });



}


async function onPlay(videoEl) {

    const detections = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions());
    //console.log(detections);

    if (isRecording) {
        detections_array.push(detections);
    }
    //console.log("detections_array",detections_array.length);
    setTimeout(() => onPlay(videoEl), 3000)
}
