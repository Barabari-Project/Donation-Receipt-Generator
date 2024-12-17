import React, { InputHTMLAttributes } from "react";
import "./Input.css";
import { FaQuestionCircle } from "react-icons/fa";


interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  errorMessage?: string | null;
  isDisable: boolean | null;
}

const Input: React.FC<InputProps> = ({ isDisable, label, errorMessage, icon, onChange, ...props }) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(event);
  };

  return (
    <div className={`appInputContainer ${props.type || ""}`}>
      {label && <label>{label}</label>}
      <div className="inputBar">
        {icon && <span>{icon}</span>}
        {
          !isDisable ?
            <input {...props} onChange={handleInputChange} className={errorMessage ? "error" : ""} />
            : <input {...props} onChange={handleInputChange} className={errorMessage ? "error" : ""} disabled />
        }
        {props.type == "password" &&
          <span className="questionMarkIcon">
            <a target="_blank" href="https://drive.google.com/drive/u/0/folders/18V0mD94B4yJtA3GNFiS5VFMy3sHoZaTO">
              <FaQuestionCircle />
            </a>
          </span>
        }
      </div>
      {
        props.type === "checkbox" ? (
          <label className="checkboxLabel">
            <span className={`checkmark ${props.checked ? "visible" : ""}`}>✔</span>
          </label>
        ) : null
      }
      {errorMessage && <p className="errorMessage">{errorMessage}</p>}
    </div >
  );
};

export default Input;
