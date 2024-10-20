import React, { useEffect, useReducer, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../assets/barabari_logo.png";
import styles from "./Home.module.scss";
import Input from "../components/Input/Input";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { LuListStart, LuListEnd } from "react-icons/lu";
import Lottie from "react-lottie-player";
import loaderAnimation from "../assets/lottie/loaderAnimation.json";
import classNames from "classnames";
import MultiEmailInput from "../components/MultiEmailInput/MultiEmailInput";
import encryptData from "../utils/encryptData";

// Initial state for inputs
const initialInputState = {
  starting: "",
  ending: "",
  password: "",
  ccEmails: [],
  file: null,
  fileName: "",
};

// Initial state for errors
const initialErrorState = {
  passwordError: "",
  startingError: "",
  endingError: "",
};

// Input reducer for managing input state
const inputReducer = (state, action) => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_CC_EMAILS":
      return { ...state, ccEmails: action.value };
    case "SET_FILE":
      return { ...state, file: action.value, fileName: action.fileName };
    case "CLEAR_INPUTS":
      return initialInputState;
    default:
      return state;
  }
};

// Error reducer for managing error state
const errorReducer = (state, action) => {
  switch (action.type) {
    case "SET_ERROR":
      return { ...state, [action.field]: action.value };
    case "CLEAR_ERRORS":
      return initialErrorState;
    default:
      return state;
  }
};

// Home component
const Home = ({ email, setEmail }) => {
  const [inputState, dispatchInput] = useReducer(inputReducer, initialInputState);
  const [errorState, dispatchError] = useReducer(errorReducer, initialErrorState);
  const [isLoading, setIsLoading] = useState(false);

  // Check server health on component mount
  useEffect(() => {
    const awakeServer = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/health`, { withCredentials: true });
      } catch (error) {
        toast.error("Internal Server Error | please contact the developers");
      }
    };
    awakeServer();
  }, []);

  // Handle input blur for validation
  const handleInputBlur = (fieldName) => {
    validateInput(fieldName);
  };

  // Validate input fields
  const validateInput = (fieldName) => {
    dispatchError({ type: "CLEAR_ERRORS" });
    const value = inputState[fieldName];
    let errorMessage = "";

    switch (fieldName) {
      case "password":
        errorMessage = !value ? "Please provide a valid password" : "";
        break;
      case "starting":
        const starting = parseInt(value, 10);
        errorMessage = !value || starting < 1 ? "Please provide a valid starting row number" : "";
        break;
      case "ending":
        const ending = parseInt(value, 10);
        errorMessage =
          !value || ending < 1 || ending < parseInt(inputState.starting, 10)
            ? "Please provide a valid ending row number"
            : "";
        break;
      default:
        break;
    }

    if (errorMessage) {
      dispatchError({ type: "SET_ERROR", field: `${fieldName}Error`, value: errorMessage });
    }
  };

  // Handle file input change
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      dispatchInput({ type: "SET_FILE", value: file, fileName: file.name });
    }
  };

  // Handle change in CC email inputs
  const handleEmailsChange = (emails) => {
    dispatchInput({ type: "SET_CC_EMAILS", value: emails });
  };

  // Handle form submission
  const handleSubmitForSOS = async () => {
    if (isLoading) return;
    dispatchError({ type: "CLEAR_ERRORS" });

    const starting = parseInt(inputState.starting, 10);
    const ending = parseInt(inputState.ending, 10);

    // Validate inputs
    if (!inputState.password) {
      dispatchError({ type: "SET_ERROR", field: "passwordError", value: "Please provide a valid password" });
      return;
    }
    if (!starting || starting < 1) {
      dispatchError({ type: "SET_ERROR", field: "startingError", value: "Please provide a valid starting row number" });
      return;
    }
    if (!ending || ending < 1) {
      dispatchError({ type: "SET_ERROR", field: "endingError", value: "Please provide a valid ending row number" });
      return;
    }
    if (starting > ending) {
      dispatchError({ type: "SET_ERROR", field: "startingError", value: "Starting row should be less than the ending row" });
      return;
    }
    if (!inputState.file) {
      toast.error("Please select a file");
      return;
    }

    try {
      setIsLoading(true);

      // Read the Excel file
      const data = await inputState.file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const ExcelDateToJSDate = (date) => {
        let convertedDate = new Date(Math.round((date - 25569) * 864e5));
        const dateString = convertedDate.toDateString().slice(4, 15); // Extract the date portion
        const dateParts = dateString.split(" ");
        const day = dateParts[1];
        const monthNumber = ("JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(dateParts[0]) / 3 + 1).toString();
        const paddedMonth = monthNumber.length === 1 ? "0" + monthNumber : monthNumber;
        return `${day}/${paddedMonth}/${dateParts[2].slice(2, 4)}`; // Fix year slice to display last two digits
      };

      const selectedRows = jsonData.slice(starting - 2, ending - 1);
      if (selectedRows.length === 0 || selectedRows.length !== ending - starting + 1) {
        toast.error("Please select a valid starting and ending row");
        return;
      }

      jsonData.forEach(data => {
        data["Date of Donation"] = ExcelDateToJSDate(data["Date of Donation"]);
      });

      // Encrypt the data
      const encryptedObj = encryptData({
        startingRowNo: starting,
        endingRowNo: ending,
        ccEmails: inputState.ccEmails,
        password: inputState.password,
        fileData: selectedRows,
      });

      // Make the Axios call
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}`,
        { encryptedData: encryptedObj },
        { withCredentials: true }
      );

      // Handle response
      if (response.status === 200) {
        toast.success("Congratulations! The recipes have been sent successfully.");
      } else {
        toast.error("Encountered an error sending mail. Please connect with the developer.");
      }
      dispatchInput({ type: "CLEAR_INPUTS" });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.data) {
          toast.error(error.response.data);
        } else {
          toast.error("Internal Server Error");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <ToastContainer />
      <div className={styles.header}>
        <img src={logo} alt="Barabari" />
        <h1>Barabari Collective</h1>
      </div>
      <div className={styles.content}>
        <Input
          type="password"
          placeholder="Password"
          value={inputState.password}
          onChange={(e) => dispatchInput({ type: "SET_FIELD", field: "password", value: e.target.value })}
          onBlur={() => handleInputBlur("password")}
          error={errorState.passwordError}
          icon={<RiLockPasswordFill />}
        />
        <Input
          type="number"
          placeholder="Starting Row"
          value={inputState.starting}
          onChange={(e) => dispatchInput({ type: "SET_FIELD", field: "starting", value: e.target.value })}
          onBlur={() => handleInputBlur("starting")}
          error={errorState.startingError}
          icon={<LuListStart />}
        />
        <Input
          type="number"
          placeholder="Ending Row"
          value={inputState.ending}
          onChange={(e) => dispatchInput({ type: "SET_FIELD", field: "ending", value: e.target.value })}
          onBlur={() => handleInputBlur("ending")}
          error={errorState.endingError}
          icon={<LuListEnd />}
        />
        <MultiEmailInput
          ccEmails={inputState.ccEmails}
          onChange={handleEmailsChange}
        />
        <input type="file" accept=".xlsx" onChange={handleFileChange} />
        <button className={styles.submitButton} onClick={handleSubmitForSOS} disabled={isLoading}>
          {isLoading ? <Lottie loop animationData={loaderAnimation} play /> : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default Home;
