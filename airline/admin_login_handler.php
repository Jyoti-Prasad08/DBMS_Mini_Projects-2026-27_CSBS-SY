<?php
session_start();

if (isset($_POST['Login'])) {
    $data_missing = array();
    
    // Check if username is empty
    if (empty($_POST['username'])) {
        $data_missing[] = 'Username';
    } else {
        $user_name = trim($_POST['username']);
    }
    
    // Check if password is empty
    if (empty($_POST['password'])) {
        $data_missing[] = 'Password';
    } else {
        $pass_word = $_POST['password'];
    }

    if (empty($data_missing)) {
        // Connect to the database
        require_once('Database Connection file/mysqli_connect.php');
        
        // Prepare the SQL statement
        $query = "SELECT count(*) FROM Admin WHERE admin_id=? AND pwd=?";
        $stmt = mysqli_prepare($dbc, $query);
        
        // Bind parameters
        mysqli_stmt_bind_param($stmt, "ss", $user_name, $pass_word);
        
        // Execute the statement
        mysqli_stmt_execute($stmt);
        
        // Bind result
        mysqli_stmt_bind_result($stmt, $cnt);
        mysqli_stmt_fetch($stmt);
        
        // Close the statement and connection
        mysqli_stmt_close($stmt);
        mysqli_close($dbc);
        
        // Check if login is successful
        if ($cnt == 1) {
            // Set session variables
            $_SESSION['login_user'] = $user_name;
            $_SESSION['user_type'] = 'Administrator';
            
            // Redirect to admin homepage
            header('Location: admin_homepage.php');
            exit();
        } else {
            // Login failed
            header('Location: admin_login_page.php?msg=failed');
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
    // Login form was not submitted
    echo "Submit request not received";
}
?>
