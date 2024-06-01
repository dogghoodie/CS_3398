import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Scanner;

public class Clipper {
	public static void main(String[] args) {
		System.out.println("Clipper.");
        
		// Define the paths to the input videos and the output video
		Scanner scanner = new Scanner(System.in);
		System.out.print("Enter path to video 1: ");
		String video1Path = scanner.nextLine();
		System.out.print("Enter path to video 2: ");
		String video2Path = scanner.nextLine();
		System.out.print("Enter path to video 3: ");
		String outputPath = scanner.nextLine();
		scanner.close();
		// Construct the command to run the Python script
		String[] command = new String[]{"python3", "src/main/python/Clipper.py", video1Path, video2Path, outputPath};
        
		try {
			// Run the Python script
			ProcessBuilder processBuilder = new ProcessBuilder(command);
			Process process = processBuilder.start();
			
			// Get the output from the process
			BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
			String line;
			while ((line = reader.readLine()) != null) {
				System.out.println(line);
		}
            
			// Get the error output from the process
			BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
			while ((line = errorReader.readLine()) != null) {
				System.err.println(line);
			}
			
			// Wait for the process to complete
			int exitCode = process.waitFor();
			if (exitCode == 0) {
				System.out.println("Python script executed successfully.");
			} else {
				System.err.println("Python script execution failed with exit code " + exitCode);
			}
		} catch (IOException | InterruptedException e) {
			e.printStackTrace();
		}
	}
}

