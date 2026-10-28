<?php
session_start();

// Display errors for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Check if the form is submitted
if (isset($_POST['Login'])) {
    $data_missing = array();
    
    // Validate the username
    if (empty($_POST['username'])) {
        $data_missing[] = 'Username';
    } else {
        $user_name = trim($_POST['username']);
    }
    
    // Validate the password
    if (empty($_POST['password'])) {
        $data_missing[] = 'Password';
    } else {
        $pass_word = trim($_POST['password']);
    }

    // Process the form if no data is missing
    if (empty($data_missing)) {
        require_once('C:\xampp\htdocs\AIRLINE\Database Connection file/mysqli_connect.php');
        
        // Prepare and execute the query
        $query = "SELECT count(*) FROM Customer WHERE customer_id=? AND pwd=?";
        $stmt = mysqli_prepare($dbc, $query);
        mysqli_stmt_bind_param($stmt, "ss", $user_name, $pass_word);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_bind_result($stmt, $cnt);
        mysqli_stmt_fetch($stmt);
        mysqli_stmt_close($stmt);
        mysqli_close($dbc);

        // Check if login is successful
        if ($cnt == 1) {
            $_SESSION['login_user'] = $user_name;
            echo "Redirecting to book_tickets2.php";
            header("Location: book_tickets2.php");
            exit();
        } else {
            // Login failed
            echo "Login Error";
            session_destroy();
            header('Location: login_page2.php?msg=failed');
            exit();
        }
    } else {
        // Display missing data
        echo "The following data fields were empty:<br>";
        foreach ($data_missing as $missing) {
            echo $missing . "<br>";
        }
    }
} else {
    // Form was not submitted
    echo "Submit request not received";
}
?>
