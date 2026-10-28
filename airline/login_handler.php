<html>
<head>
    <title>Login Handler</title>
</head>
<body>
    <?php
        session_start();
        session_destroy();
        session_start();
        if (isset($_POST['Login'])) {
            $data_missing = array();

            // Validate and trim username
            if (empty($_POST['username'])) {
                $data_missing[] = 'Username';
            } else {
                $user_name = trim($_POST['username']);
            }

            // Validate and trim password
            if (empty($_POST['password'])) {
                $data_missing[] = 'Password';
            } else {
                $pass_word = $_POST['password'];
            }

            // Check if there are any missing fields
            if (empty($data_missing)) {
                require_once('Database Connection file/mysqli_connect.php');

                // Check customer credentials
                $query = "SELECT COUNT(*) FROM Customer WHERE customer_id=? AND pwd=?";
                $stmt = mysqli_prepare($dbc, $query);
                mysqli_stmt_bind_param($stmt, "ss", $user_name, $pass_word);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_bind_result($stmt, $cnt);
                mysqli_stmt_fetch($stmt);
                mysqli_stmt_close($stmt);
                mysqli_close($dbc);

                if ($cnt == 1) {
                    // Successful login
                    $_SESSION['login_user'] = $user_name;
                    echo "Logged in <br>";
                    echo $_SESSION['login_user'] . " is logged in";
                    header("Location: customer_homepage.php");
                } else {
                    // Invalid credentials
                    echo "Login Error";
                    session_destroy();
                    header('Location: login_page.php?msg=failed');
                }
            } else {
                // Display missing fields
                echo "The following data fields were empty<br>";
                foreach ($data_missing as $missing) {
                    echo $missing . "<br>";
                }
            }
        } else {
            echo "Submit request not received";
        }
    ?>
</body>
</html>
