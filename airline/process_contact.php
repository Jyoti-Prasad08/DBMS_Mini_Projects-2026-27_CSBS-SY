<?php
// Include the database connection file
include 'C:\xampp\htdocs\AIRLINE\AIRLINE\mysqli_connect.php';

// Check if the form is submitted
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Get form data
    $name = mysqli_real_escape_string($dbc, $_POST['name']);
    $email = mysqli_real_escape_string($dbc, $_POST['email']);
    $message = mysqli_real_escape_string($dbc, $_POST['message']);

    // Insert data into the database
    $query = "INSERT INTO contact_messages (name, email, message) VALUES ('$name', '$email', '$message')";
    
    if (mysqli_query($dbc, $query)) {
        echo "Message sent successfully.";
    } else {
        echo "Error: " . $query . "<br>" . mysqli_error($dbc);
    }

    // Close the database connection
    mysqli_close($dbc);
}
?>
