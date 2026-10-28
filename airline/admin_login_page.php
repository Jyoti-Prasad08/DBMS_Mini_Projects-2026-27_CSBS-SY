<?php session_start(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - INDIAN Airlines</title>
    <link rel="stylesheet" href="font-awesome-4.7.0/css/font-awesome.min.css">
    <style>
        /* Reset default styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            color: #333;
            margin: 0;
            padding: 0;
            background-image: url('images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }

        .container {
            width: 80%;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            background-color: rgba(3, 3, 55, 0.8); /* Semi-transparent dark background */
            color: #fff;
            padding: 10px 0;
            text-align: center;
        }

        header .logo {
            width: 100px;
            height: auto;
            margin-bottom: 10px;
        }

        header #title {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 20px;
        }

        nav ul {
            list-style-type: none;
            margin: 0;
            padding: 0;
            text-align: center;
        }

        nav ul li {
            display: inline-block;
            margin-right: 20px;
        }

        nav ul li a {
            color: #fff;
            text-decoration: none;
            padding: 10px;
        }

        nav ul li a:hover {
            background-color: #E7E7F6;
            color: #030337;
        }

        form {
            background-color: rgba(255, 255, 255, 0.9); /* Semi-transparent white background */
            width: 50%;
            margin: 20px auto;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            text-align: center;
        }

        form fieldset {
            border: none;
            margin-bottom: 20px;
        }

        form legend {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        form strong {
            font-weight: bold;
        }

        form input[type=text], 
        form input[type=password] {
            width: calc(100% - 20px);
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            text-align: center;
        }

        form input[type=submit] {
            background-color: #030337;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 12px 20px;
            font-size: 16px;
            cursor: pointer;
        }

        form input[type=submit]:hover {
            background-color: #02436C;
        }

        form a {
            text-decoration: none;
            color: #030337;
            font-weight: bold;
        }

        form a:hover {
            text-decoration: underline;
        }

        footer {
            background-color: rgba(3, 3, 55, 0.8); /* Semi-transparent dark background */
            color: #fff;
            text-align: center;
            padding: 10px 0;
            position: relative;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <img class="logo" src="images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg" alt="Airline Logo">
            <h1 id="title">INDIAN AIRLINES</h1>
            <nav>
                <ul>
                    <li><a href="home_page.php"><i class="fa fa-home" aria-hidden="true"></i> Home</a></li>
                 </ul>
            </nav>
        </div>
    </header>

    <form action="admin_login_handler.php" method="POST">
        <fieldset>
            <legend>Admin Login</legend>
            <strong>Username:</strong><br>
            <input type="text" name="username" placeholder="Enter your username" required><br><br>
            <strong>Password:</strong><br>
            <input type="password" name="password" placeholder="Enter your password" required><br><br>
            <?php
                if(isset($_GET['msg']) && $_GET['msg']=='failed') {
                    echo "<strong style='color:red'>Invalid Username/Password</strong><br><br>";
                }
            ?>
            <input type="submit" name="Login" value="Login">
        </fieldset>
    </form>

    <footer>
        <div class="container">
            <p>&copy; <?php echo date('Y'); ?> INDIAN Airlines. All rights reserved.</p>
        </div>
    </footer>

</body>
</html>
