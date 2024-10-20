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
import { LuListStart } from "react-icons/lu";
import { LuListEnd } from "react-icons/lu";
import Lottie from "react-lottie-player";
import loaderAnimation from "../assets/lottie/loaderAnimation.json";
import classNames from "classnames";
import MultiEmailInput from "../components/MultiEmailInput/MultiEmailInput";
import encryptData from "../utils/encryptData";

// type InputState = {
//     starting: number | "";
//     ending: number | "";
//     email: string;
//     password: string;
//     ccEmails: string[];
//     file: File | null;
//     fileName: string;
// };

// type ErrorState = {
//     emailError: string;
//     passwordError: string;
//     startingError: string;
//     endingError: string;
// };

// type InputAction =
//     | {
//         type: "SET_FIELD";
//         field: keyof Omit<InputState, "ccEmails">;
//         value: string | number | File | null;
//     }
//     | { type: "SET_CC_EMAILS"; value: string[] }
//     | { type: "SET_FILE"; value: File | null; fileName: string }
//     | { type: "CLEAR_INPUTS" };

// type ErrorAction =
//     | { type: "SET_ERROR"; field: keyof ErrorState; value: string }
//     | { type: "CLEAR_ERRORS" };

const initialInputState = {
  starting: "",
  ending: "",
  password: "",
  ccEmails: [],
  file: null,
  fileName: "",
};

const initialErrorState = {
  passwordError: "",
  startingError: "",
  endingError: "",
};

const inputReducer = (state, action) => {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };
    case "SET_CC_EMAILS":
      return {
        ...state,
        ccEmails: action.value,
      };
    case "SET_FILE":
      return {
        ...state,
        file: action.value,
        fileName: action.fileName,
      };
    case "CLEAR_INPUTS":
      return initialInputState;
    default:
      return state;
  }
};

const errorReducer = (state, action) => {
  switch (action.type) {
    case "SET_ERROR":
      return {
        ...state,
        [action.field]: action.value,
      };
    case "CLEAR_ERRORS":
      return initialErrorState;
    default:
      return state;
  }
};

const Home = ({ email, setEmail }) => {
  const [inputState, dispatchInput] = useReducer(
    inputReducer,
    initialInputState
  );

  const [errorState, dispatchError] = useReducer(
    errorReducer,
    initialErrorState
  );

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const awakeServer = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/health`, {
          withCredentials: true,
        });
      } catch (error) {
        toast.error("Internal Server Error | please contact to developers");
      }
    };
    awakeServer();
  }, []);

  const handleInputBlur = (fieldName) => {
    validateInput(fieldName);
  };

  const validateInput = (fieldName) => {
    dispatchError({ type: "CLEAR_ERRORS" });
    const value = inputState[fieldName];
    let errorMessage = "";

    // Define variables outside the switch statement
    let starting, ending;

    switch (fieldName) {
      case "password":
        errorMessage = !value ? "Please provide a valid password" : "";
        break;
      case "starting":
        starting = parseInt(value, 10);
        errorMessage =
          !value || starting < 1
            ? "Please provide a valid starting row number"
            : "";
        break;
      case "ending":
        ending = parseInt(value, 10);
        errorMessage =
          !value || ending < 1 || ending < parseInt(inputState.starting, 10)
            ? "Please provide a valid ending row number"
            : "";
        break;
      default:
        break;
    }

    dispatchError({
      type: "SET_ERROR",
      field: `${fieldName}Error`,
      value: errorMessage,
    });
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      dispatchInput({ type: "SET_FILE", value: file, fileName: file.name });
    }
  };

  const handleEmailsChange = (emails) => {
    dispatchInput({ type: "SET_CC_EMAILS", value: emails });
  };

  const handleSubmitForSOS = async () => {
    if (isLoading) return;
    dispatchError({ type: "CLEAR_ERRORS" });

    const starting = parseInt(inputState.starting, 10);
    const ending = parseInt(inputState.ending, 10);

    if (!inputState.password) {
      dispatchError({
        type: "SET_ERROR",
        field: "passwordError",
        value: "Please provide a valid password",
      });
      return;
    }
    if (!starting || starting < 1) {
      dispatchError({
        type: "SET_ERROR",
        field: "startingError",
        value: "Please provide a valid starting row number",
      });
      return;
    }
    if (!ending || ending < 1) {
      dispatchError({
        type: "SET_ERROR",
        field: "endingError",
        value: "Please provide a valid ending row number",
      });
      return;
    }
    if (starting > ending) {
      dispatchError({
        type: "SET_ERROR",
        field: "startingError",
        value: "Starting row should be less than the ending row",
      });
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
        let month = dateParts[0];
        const year = dateParts[2];
        // Convert month name to number
        const monthNumber = (
          "JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(month) / 3 +
          1
        ).toString();
        const paddedMonth =
          monthNumber.length === 1 ? "0" + monthNumber : monthNumber;

        return `${day}/${paddedMonth}/${year.slice(2, 4)}`;
      };
      const starting = Number(inputState.starting);
      const ending = Number(inputState.ending);
      const selectedRows = jsonData.slice(starting - 2, ending - 1);

      if (
        selectedRows.length === 0 ||
        selectedRows.length !== ending - starting + 1
      ) {
        toast.error("Please Select a valid starting and ending row");
        return;
      }
      jsonData.forEach(
        (data) =>
          (data["Date of Donation"] = ExcelDateToJSDate(
            data["Date of Donation"]
          ))
      );

      const encryptedObj = encryptData({
        startingRowNo: starting,
        endingRowNo: ending,
        ccEmails: inputState.ccEmails,
        password: inputState.password,
        fileData: selectedRows, // Include the Excel data in the payload
      });

      // Making the Axios call
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}`,
        { encryptedData: encryptedObj },
        {
          withCredentials: true,
        }
      );

      // Handle success
      if (response.status === 200) {
        toast.success(
          "Congratulations! The recipes have been sent successfully."
        );
      } else {
        toast.error(
          "Encounter Error in sending mail please connect to the developer"
        ); // error
      }
      dispatchInput({ type: "CLEAR_INPUTS" });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Specific handling for Axios errors
        if (error.response && error.response.data) {
          toast.error(error.response.data);
        } else {
          toast.error("Internal Server Error");
        }
      } else {
        // General error handling
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
          onChange={(e) =>
            dispatchInput({
              type: "SET_FIELD",
              field: "password",
              value: e.target.value,
            })
          }
          onBlur={() => handleInputBlur("password")}
          error={errorState.passwordError}
          icon={<RiLockPasswordFill />}
        />
        <Input
          type="number"
          placeholder="Starting Row"
          value={inputState.starting}
          onChange={(e) =>
            dispatchInput({
              type: "SET_FIELD",
              field: "starting",
              value: e.target.value,
            })
          }
          onBlur={() => handleInputBlur("starting")}
          error={errorState.startingError}
          icon={<LuListStart />}
        />
        <Input
          type="number"
          placeholder="Ending Row"
          value={inputState.ending}
          onChange={(e) =>
            dispatchInput({
              type: "SET_FIELD",
              field: "ending",
              value: e.target.value,
            })
          }
          onBlur={() => handleInputBlur("ending")}
          error={errorState.endingError}
          icon={<LuListEnd />}
        />
        <MultiEmailInput
          emails={inputState.ccEmails}
          onChange={handleEmailsChange}
        />
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        <button
          className={classNames(styles.submitButton, {
            [styles.loading]: isLoading,
          })}
          onClick={handleSubmitForSOS}
          disabled={isLoading}
        >
          {isLoading ? (
            <Lottie
              loop
              animationData={loaderAnimation}
              play
              style={{ width: "30px", height: "30px" }}
            />
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </div>
  );
};

export default Home;
