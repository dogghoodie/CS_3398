from moviepy.editor import VideoFileClip, concatenate_videoclips

def combine_videos(video1_path, video2_path, output_path):
    # Load clips
    clip1 = VideoFileClip(video1_path)
    clip2 = VideoFileClip(video2_path)

    # Concatenate the clips
    final_clip = concatenate_videoclips([clip1, clip2])

    # Write to file
    final_clip.write_videofile(output_path, codec='libx264')

if __name__ == "__main__":
    # Define the paths to the input videos and the output video
    video1_path = input("Path to video 1: ")
    video2_path = input("Path to video 2: ")
    output_path = input("Path for result: ")

    # Combine the videos
    combine_videos(video1_path, video2_path, output_path)    
